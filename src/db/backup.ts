import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { getDB, resetDB, initDatabase } from '../../database';

const DB_NAME = 'vetstore.db';

export const exportDatabase = async () => {
  try {
    const db = getDB();
    // Serialize merges WAL internally into a single block of bytes cleanly.
    const serializedData = await db.serializeAsync();

    const date = new Date().toISOString().split('T')[0];
    const backupFile = new File(Paths.cache, `New-Malik-Veterinary-Backup-${date}.sqlite`);

    if (backupFile.exists) {
      backupFile.delete();
    }
    
    // Write the raw bytes to the .sqlite file
    backupFile.create();
    backupFile.write(serializedData);

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Error', 'Sharing is not available on this device.');
      return;
    }

    await Sharing.shareAsync(backupFile.uri, {
      mimeType: 'application/x-sqlite3',
      dialogTitle: 'Export Vet Store Database',
    });
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

    const sourceFile = new File(result.assets[0].uri);

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
                // Read bytes from the imported file
                const bytes = await sourceFile.bytes();

                const db = getDB();
                const currentPath = db.databasePath;
                
                // Sever the active database connection
                resetDB();

                // Safely destroy existing database and clear fragmented WAL/SHM temp files.
                await SQLite.deleteDatabaseAsync(DB_NAME);

                // Write pure backup bytes to the exact OS-approved internal sqlite path
                const destFile = new File(currentPath);
                destFile.write(bytes);

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
