import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useState } from "react";
import { Link } from "expo-router";
import { exportDatabase, importDatabase } from "../../src/db/backup";
import { DownloadCloud, UploadCloud, FileText, PieChart } from "lucide-react-native";

export default function SettingsIndex() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    if (isExporting || isImporting) return;
    setIsExporting(true);
    await exportDatabase();
    setIsExporting(false);
  };

  const handleImport = async () => {
    if (isExporting || isImporting) return;
    setIsImporting(true);
    await importDatabase();
    setIsImporting(false);
  };

  return (
    <ScrollView className="flex-1 bg-primary-50 p-4">
      <Text className="text-lg font-bold text-gray-800 mb-3 mt-2">Reports</Text>
      
      <View className="bg-white rounded-2xl p-2 mb-6 border border-gray-100 shadow-sm">
        <Link href="/reports/daily" asChild>
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
            <View className="bg-primary-100 p-2 rounded-lg mr-4">
              <PieChart size={24} color="#2563eb" />
            </View>
            <View>
              <Text className="text-base font-bold text-gray-800">Sales Reports (Daily/Monthly)</Text>
              <Text className="text-gray-500 text-sm mt-1">View revenue and profit trends</Text>
            </View>
          </TouchableOpacity>
        </Link>
        <Link href="/reports/products" asChild>
          <TouchableOpacity className="flex-row items-center p-4">
            <View className="bg-green-100 p-2 rounded-lg mr-4">
              <FileText size={24} color="#16a34a" />
            </View>
            <View>
              <Text className="text-base font-bold text-gray-800">Product Performance</Text>
              <Text className="text-gray-500 text-sm mt-1">Best selling products</Text>
            </View>
          </TouchableOpacity>
        </Link>
      </View>

      <Text className="text-lg font-bold text-gray-800 mb-3">Data Management (Offline)</Text>
      <View className="bg-white rounded-2xl p-4 mb-10 border border-gray-100 shadow-sm">
        <Text className="text-gray-500 mb-6 leading-relaxed">
          Your data is stored 100% locally on this device. You should export backups regularly to avoid data loss in case this device breaks or app data is cleared.
        </Text>

        <TouchableOpacity 
          className={`p-4 rounded-xl items-center flex-row justify-center mb-4 ${isExporting ? 'bg-primary-400' : 'bg-primary-600'}`}
          onPress={handleExport}
          disabled={isExporting || isImporting}
        >
          {isExporting ? (
            <ActivityIndicator color="white" />
          ) : (
            <DownloadCloud color="white" size={20} />
          )}
          <Text className="text-white font-bold ml-2 text-lg">
            {isExporting ? 'Exporting...' : 'Export Backup (.db)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className={`border border-gray-300 p-4 rounded-xl items-center flex-row justify-center ${isImporting ? 'bg-gray-200' : 'bg-gray-100'}`}
          onPress={handleImport}
          disabled={isExporting || isImporting}
        >
          {isImporting ? (
            <ActivityIndicator color="#374151" />
          ) : (
            <UploadCloud color="#374151" size={20} />
          )}
          <Text className="text-gray-800 font-bold ml-2 text-lg">
            {isImporting ? 'Importing...' : 'Import Backup (.db)'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
