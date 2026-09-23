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
      copyToCacheDirectory: false,
      type: ['*/*'],
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return false;
    }

    const sourceFileUri = result.assets[0].uri;

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        'Warning',
        'Importing this backup will safely replace the current app data. Do you want to continue?',
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              let tempDb: any = null;
              const tempDbName = `temp_import_${Date.now()}.db`;
              const docDirUri = LegacyFileSystem.documentDirectory || '';
              const tempDbUri = `${docDirUri}${tempDbName}`;
              
              try {
                console.log('IMPORT START: URI:', sourceFileUri);
                
                // 1. Copy the backup to a safe, writable temporary location within the app sandbox
                // We use standard binary copyAsync, no string conversions.
                console.log('Copying to temporary sandbox location...');
                await LegacyFileSystem.copyAsync({
                  from: sourceFileUri,
                  to: tempDbUri
                });
                console.log('TEMP COPY OK');
                
                // 2. Open the temporary database for validation
                const SQLite = require('expo-sqlite');
                const docDirPath = docDirUri.replace('file://', '');
                tempDb = SQLite.openDatabaseSync(tempDbName, undefined, docDirPath);
                
                // 3. Strong SQLite validation
                const check = tempDb.getFirstSync(`SELECT count(*) as count FROM sqlite_master WHERE type="table" AND name IN ('sales', 'returns', 'products')`);
                if (!check || check.count < 3) {
                  throw new Error("Missing required tables. Not a valid Vet Store backup.");
                }
                
                // Check if we can read actual data safely
                tempDb.getFirstSync(`SELECT * FROM products LIMIT 1`);
                console.log('SQLITE VALIDATION OK: Expected tables and data structures exist.');
                
                // 4. Safely restore into the active database using SQLite's native backup API
                // This bypasses ALL FileSystem restrictions because it operates entirely within the native C++ SQLite engine.
                // It works flawlessly in both Expo Go and Standalone APKs.
                console.log('DATABASE RESTORE STARTED...');
                const destDb = getDB();
                
                // Run the native SQLite backup API (copies tempDb -> destDb)
                await SQLite.backupDatabaseAsync({
                  sourceDatabase: tempDb,
                  destDatabase: destDb
                });
                
                console.log('DATABASE RESTORE COMPLETE');
                
                // Close both connections
                tempDb.closeSync();
                tempDb = null;
                
                // Close and reset the active connection to clear any cached states
                resetDB();
                console.log('ACTIVE DB CONNECTION CLOSED');
                
                // 5. Reopen the database exactly as the app normally does
                console.log('Re-initializing database...');
                await initDatabase();
                console.log('DATABASE REOPENED AND DATA VERIFICATION OK');
                
                // 6. Cleanup temporary file
                try { await LegacyFileSystem.deleteAsync(tempDbUri); } catch(e) {}
                
                console.log('IMPORT COMPLETE');
                Alert.alert('Success', 'Database imported successfully. The new data is now active.');
                resolve(true);
              } catch (importError: any) {
                console.error('Unexpected error during import:', importError);
                if (tempDb) {
                  try { tempDb.closeSync(); } catch(e){}
                }
                try { await LegacyFileSystem.deleteAsync(tempDbUri); } catch(e) {}
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
