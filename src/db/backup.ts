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
                
                // 1. Open a temporary database to get a valid, writable path
                const tempDbName = `temp_import_${Date.now()}.db`;
                let tempDb: any = null;
                try {
                  // We require expo-sqlite directly to create a temp db
                  const SQLite = require('expo-sqlite');
                  tempDb = SQLite.openDatabaseSync(tempDbName);
                } catch (e) {
                  console.error('Failed to create temp DB:', e);
                  Alert.alert('Error', 'Failed to prepare import environment.');
                  resolve(false);
                  return;
                }
                
                const tempDbPath = tempDb.databasePath;
                tempDb.closeSync(); // Close before overwriting
                
                // 2. Copy the picked file to the temporary database path
                try {
                  console.log(`Copying from ${sourceFileUri} to ${tempDbPath}`);
                  await LegacyFileSystem.copyAsync({
                    from: sourceFileUri,
                    to: tempDbPath
                  });
                } catch (copyError: any) {
                  console.error('Error copying file:', copyError);
                  Alert.alert('Error', `Failed to read the backup file.\nDetails: ${copyError?.message || copyError}`);
                  resolve(false);
                  return;
                }
                
                // 3. Re-open the temporary database to validate it
                try {
                  const SQLite = require('expo-sqlite');
                  tempDb = SQLite.openDatabaseSync(tempDbName);
                  const check = tempDb.getFirstSync(`SELECT count(*) as count FROM sqlite_master WHERE type="table" AND name IN ('sales', 'returns', 'products')`);
                  if (!check || check.count < 3) {
                    throw new Error("Missing required tables.");
                  }
                  tempDb.closeSync();
                } catch (validationErr: any) {
                  console.error('Validation failed for temp DB:', validationErr);
                  if (tempDb) {
                    try { tempDb.closeSync(); } catch(e){}
                  }
                  Alert.alert('Error', `The selected file is not a valid Vet Store backup.\nDetails: ${validationErr?.message || validationErr}`);
                  resolve(false);
                  return;
                }
                
                // 4. Validation passed! Swap active database safely.
                console.log('Validation passed. Swapping active database...');
                const db = getDB();
                const currentPath = db.databasePath;
                
                // Close active connection
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
                  await LegacyFileSystem.copyAsync({
                    from: tempDbPath,
                    to: currentPath
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
