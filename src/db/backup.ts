import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

const DB_NAME = 'vetstore.db';

export const exportDatabase = async () => {
  try {
    const dbFile = new File(Paths.document, `SQLite/${DB_NAME}`);

    if (!dbFile.exists) {
      Alert.alert('Error', 'Database file not found.');
      return;
    }

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Error', 'Sharing is not available on this device.');
      return;
    }

    await Sharing.shareAsync(dbFile.uri, {
      mimeType: 'application/octet-stream',
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
    const dbFile = new File(Paths.document, `SQLite/${DB_NAME}`);

    // Create intermediate directories just in case
    // new Directory(Paths.document, 'SQLite').create(); // Actually, expo-sqlite creates it usually.
    
    // Copy/overwrite the database file
    sourceFile.copy(dbFile, { overwrite: true });

    Alert.alert(
      'Import Successful', 
      'The database has been imported successfully. Please completely restart the app (close and reopen) to apply the changes.',
      [{ text: 'OK' }]
    );
    return true;

  } catch (error) {
    console.error('Error importing database:', error);
    Alert.alert('Error', 'Failed to import database.');
    return false;
  }
};
