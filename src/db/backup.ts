import * as LegacyFileSystem from 'expo-file-system/legacy';
const { StorageAccessFramework } = LegacyFileSystem;
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';
import { getDB, resetDB, initDatabase } from '../../database';

const DB_NAME = 'vetstore.db';

export const exportDatabase = async () => {
  try {
    const db = getDB();
    const serializedData = await db.serializeAsync();
    const date = new Date().toISOString().split('T')[0];
    const fileName = `New_Malik_Veterinary_Backup_${date}.sqlite`;
    
    // Write to a temporary cache file first to easily extract Base64
    const backupFile = new File(Paths.cache, fileName);
    if (backupFile.exists) {
      backupFile.delete();
    }
    backupFile.create();
    backupFile.write(serializedData);

    if (Platform.OS === 'android') {
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      
      if (!permissions.granted) {
        Alert.alert('Permission Denied', 'Please select a folder to save your backup.');
        return;
      }
      
      // Read the cache file as Base64
      const base64Data = await LegacyFileSystem.readAsStringAsync(backupFile.uri, {
        encoding: LegacyFileSystem.EncodingType.Base64,
      });

      // Create file in the selected directory (e.g., Downloads)
      const newFileUri = await StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        'application/x-sqlite3'
      );

      // Write the Base64 data to the new file
      await StorageAccessFramework.writeAsStringAsync(newFileUri, base64Data, {
        encoding: LegacyFileSystem.EncodingType.Base64,
      });

      Alert.alert('Success', `Database backup saved successfully to the selected folder!`);
    } else {
      // Fallback for iOS
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Error', 'Sharing is not available on this device.');
        return;
      }
      await Sharing.shareAsync(backupFile.uri, {
        mimeType: 'application/x-sqlite3',
        dialogTitle: 'Export Vet Store Database',
      });
      Alert.alert('Success', 'Database backup exported.');
    }
  } catch (error) {
    console.error('Error exporting database:', error);
    Alert.alert('Error', 'Failed to export database.');
  }
};

export const importDatabase = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: false, // Prevent expo-document-picker caching bug
      type: ['*/*'],
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return false;
    }

    const sourceFileUri = result.assets[0].uri;

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        'Warning',
        'Importing this backup will replace the current app data. Do you want to continue?',
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              try {
                console.log('Import started for URI:', sourceFileUri);
                
                // 1. Define a temporary database path in the universally writable documentDirectory
                const tempDbName = `temp_import_${Date.now()}.db`;
                // ensure documentDirectory exists and ends with slash
                const tempDbDir = LegacyFileSystem.documentDirectory || ''; 
                const tempDbPath = `${tempDbDir}${tempDbName}`;
                
                // 2. Read from the source URI as Base64 and write to the temp path
                // This bypasses any Android OS content:// file copy restrictions
                try {
                  console.log(`Reading from ${sourceFileUri}`);
                  const base64Data = await LegacyFileSystem.readAsStringAsync(sourceFileUri, {
                    encoding: LegacyFileSystem.EncodingType.Base64,
                  });
                  
                  console.log(`Writing to ${tempDbPath}`);
                  await LegacyFileSystem.writeAsStringAsync(tempDbPath, base64Data, {
                    encoding: LegacyFileSystem.EncodingType.Base64,
                  });
                  
                  // Verify temp file size
                  const fileInfo = await LegacyFileSystem.getInfoAsync(tempDbPath);
                  if (!fileInfo.exists || fileInfo.size === 0) {
                    throw new Error("Imported file is empty or missing.");
                  }
                } catch (copyError: any) {
                  console.error('Error copying file via base64:', copyError);
                  Alert.alert('Error', `Failed to read or write the backup file.\nDetails: ${copyError?.message || copyError}`);
                  resolve(false);
                  return;
                }
                
                // 3. Open the copied temporary database to validate it
                let tempDb: any = null;
                try {
                  const SQLite = require('expo-sqlite');
                  // openDatabaseSync supports (name, options, directory)
                  tempDb = SQLite.openDatabaseSync(tempDbName, undefined, tempDbDir);
                  
                  const check = tempDb.getFirstSync(`SELECT count(*) as count FROM sqlite_master WHERE type="table" AND name IN ('sales', 'returns', 'products')`);
                  if (!check || check.count < 3) {
                    throw new Error("Missing required tables. Not a valid Vet Store backup.");
                  }
                  tempDb.closeSync();
                } catch (validationErr: any) {
                  console.error('Validation failed for temp DB:', validationErr);
                  if (tempDb) {
                    try { tempDb.closeSync(); } catch(e){}
                  }
                  Alert.alert('Error', `The selected file is not a valid Vet Store backup.\nDetails: ${validationErr?.message || validationErr}`);
                  // Cleanup invalid temp DB
                  try { await LegacyFileSystem.deleteAsync(tempDbPath); } catch(e) {}
                  resolve(false);
                  return;
                }
                
                // 4. Validation passed! Swap active database safely.
                console.log('Validation passed. Swapping active database...');
                const db = getDB();
                const currentPath = db.databasePath;
                
                // Close active connection completely
                resetDB();
                
                // Clear old WAL/SHM to prevent corruption of the new DB
                const walPath = `${currentPath}-wal`;
                const shmPath = `${currentPath}-shm`;
                try {
                  const walInfo = await LegacyFileSystem.getInfoAsync(walPath);
                  if (walInfo.exists) await LegacyFileSystem.deleteAsync(walPath);
                  const shmInfo = await LegacyFileSystem.getInfoAsync(shmPath);
                  if (shmInfo.exists) await LegacyFileSystem.deleteAsync(shmPath);
                } catch (e) {
                  console.log("No WAL/SHM to clear.");
                }
                
                // Replace the active DB with the validated temp DB
                try {
                  // We MUST NOT delete the active currentPath first! 
                  // If we delete it, creating a new file in the /SQLite/ directory will fail 
                  // with "isn't writable" due to Expo SQLite sandbox restrictions.
                  // Instead, we overwrite the existing file's bytes.
                  console.log('Writing final database to active path...');
                  const finalDbBase64 = await LegacyFileSystem.readAsStringAsync(tempDbPath, {
                    encoding: LegacyFileSystem.EncodingType.Base64,
                  });
                  await LegacyFileSystem.writeAsStringAsync(currentPath, finalDbBase64, {
                    encoding: LegacyFileSystem.EncodingType.Base64,
                  });
                } catch (swapError: any) {
                  console.error('CRITICAL: Failed to swap database files:', swapError);
                  Alert.alert('Critical Error', 'Failed to replace the database file. App restart may be required.');
                  resolve(false);
                  return;
                }
                
                // 5. Cleanup the temporary database
                try {
                  await LegacyFileSystem.deleteAsync(tempDbPath);
                } catch(e) {}
                
                // Restart JS database connection & run migrations
                try {
                  console.log('Re-initializing database...');
                  initDatabase();
                } catch (initError: any) {
                  console.error('Error re-initializing DB:', initError);
                  Alert.alert('Warning', `Database imported but initialization encountered an error.\nDetails: ${initError?.message || initError}`);
                  resolve(true); 
                  return;
                }
                
                console.log('Import process complete.');
                Alert.alert('Success', 'Database imported successfully.');
                resolve(true);
              } catch (importError: any) {
                console.error('Unexpected error during import:', importError);
                Alert.alert('Error', `Failed to import backup.\nDetails: ${importError?.message || importError}`);
                resolve(false);
              }
            },
          },
        ]
      );
    });
  } catch (error: any) {
    console.error('Error in importDatabase picker flow:', error);
    Alert.alert('Error', `Failed to select backup file.\nDetails: ${error?.message || error}`);
    return false;
  }
};
