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
      copyToCacheDirectory: true,
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
                const db = getDB();
                const currentPath = db.databasePath;
                
                // Sever the active database connection
                resetDB();

                // Safely copy the imported file over the existing database
                await LegacyFileSystem.copyAsync({
                  from: sourceFileUri,
                  to: currentPath
                });

                // Clear any residual WAL or SHM files which might cause corruption
                const walPath = `${currentPath}-wal`;
                const shmPath = `${currentPath}-shm`;
                
                try {
                  const walInfo = await LegacyFileSystem.getInfoAsync(walPath);
                  if (walInfo.exists) {
                    await LegacyFileSystem.deleteAsync(walPath);
                  }
                  
                  const shmInfo = await LegacyFileSystem.getInfoAsync(shmPath);
                  if (shmInfo.exists) {
                    await LegacyFileSystem.deleteAsync(shmPath);
                  }
                } catch (e) {
                  console.log("No WAL/SHM temp files to clear.");
                }

                // Restart JS database connection & tables
                initDatabase();
                
                // Validate that this is actually a Vet Store database
                const newDb = getDB();
                try {
                  const check = newDb.getFirstSync<{count: number}>(`SELECT count(*) as count FROM sqlite_master WHERE type="table" AND name IN ('sales', 'returns', 'products')`);
                  if (!check || check.count < 3) {
                    throw new Error("Invalid database format.");
                  }
                } catch (validationErr) {
                  console.error('Validation failed:', validationErr);
                  Alert.alert('Error', 'The imported file is not a valid Vet Store backup. Data may be corrupted.');
                  resolve(false);
                  return;
                }

                Alert.alert('Success', 'Database imported successfully.');
                resolve(true);
              } catch (importError) {
                console.error('Error importing backup:', importError);
                Alert.alert('Error', 'Failed to import backup.');
                resolve(false);
              }
            },
          },
        ]
      );
    });
  } catch (error) {
    console.error('Error in importDatabase flow:', error);
    Alert.alert('Error', 'Failed to read backup file.');
    return false;
  }
};
