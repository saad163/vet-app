import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
const { StorageAccessFramework } = LegacyFileSystem;
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { getDailyReport, getMonthlyReport, DailyReport, MonthlyReport } from "../../src/db/reports";
import { getPDFReportData } from "../../src/db/pdf";
import { generatePDFHtml } from "../../src/utils/pdf-template";

export default function DailyMonthlyReports() {
  const [isExporting, setIsExporting] = useState(false);
  const [tab, setTab] = useState<'daily' | 'monthly' | 'export'>('daily');
  const [dailyData, setDailyData] = useState<DailyReport[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyReport[]>([]);

  const [exportType, setExportType] = useState<'daily' | 'monthly' | 'custom'>('daily');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().toISOString().split('-').slice(0,2).join('-')); // YYYY-MM
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // DatePicker States
  const [showDailyPicker, setShowDailyPicker] = useState(false);
  const [showMonthlyPicker, setShowMonthlyPicker] = useState(false);
  const [showCustomFromPicker, setShowCustomFromPicker] = useState(false);
  const [showCustomToPicker, setShowCustomToPicker] = useState(false);

  // Internal Date Objects for DateTimePicker
  const [dailyDateObj, setDailyDateObj] = useState(new Date());
  const [monthlyDateObj, setMonthlyDateObj] = useState(new Date());
  const [customFromObj, setCustomFromObj] = useState(new Date());
  const [customToObj, setCustomToObj] = useState(new Date());

  const onDailyChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDailyPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDailyDate(selectedDate.toISOString().split('T')[0]);
      setDailyDateObj(selectedDate);
    }
  };

  const onMonthlyChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowMonthlyPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setMonthlyMonth(selectedDate.toISOString().split('-').slice(0, 2).join('-'));
      setMonthlyDateObj(selectedDate);
    }
  };

  const onCustomFromChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowCustomFromPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCustomFrom(selectedDate.toISOString().split('T')[0]);
      setCustomFromObj(selectedDate);
    }
  };

  const onCustomToChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowCustomToPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCustomTo(selectedDate.toISOString().split('T')[0]);
      setCustomToObj(selectedDate);
    }
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatMonthForDisplay = (monthStr: string) => {
     if (!monthStr) return '';
     try {
       const [year, month] = monthStr.split('-');
       const d = new Date(Number(year), Number(month) - 1, 1);
       if (isNaN(d.getTime())) return monthStr;
       return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
     } catch {
       return monthStr;
     }
  };

  useFocusEffect(
    useCallback(() => {
      setDailyData(getDailyReport());
      setMonthlyData(getMonthlyReport());
    }, [])
  );

  const handleDownloadPDF = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      let startDate = '';
      let endDate = '';
      let reportName = '';

      if (exportType === 'daily') {
        if (!dailyDate || dailyDate.length !== 10) {
          Alert.alert("Error", "Please enter a valid date (YYYY-MM-DD)");
          return;
        }
        startDate = dailyDate;
        endDate = dailyDate;
        reportName = `Daily-${dailyDate}`;
      } else if (exportType === 'monthly') {
        if (!monthlyMonth || monthlyMonth.length !== 7) {
          Alert.alert("Error", "Please enter a valid month (YYYY-MM)");
          return;
        }
        startDate = `${monthlyMonth}-01`;
        endDate = `${monthlyMonth}-31`;
        reportName = `Monthly-${monthlyMonth}`;
      } else if (exportType === 'custom') {
        if (!customFrom || !customTo || customFrom.length !== 10 || customTo.length !== 10) {
          Alert.alert("Error", "Please enter valid From and To dates (YYYY-MM-DD)");
          return;
        }
        if (customFrom > customTo) {
          Alert.alert("Error", "From date cannot be later than To date");
          return;
        }
        startDate = customFrom;
        endDate = customTo;
        reportName = `${customFrom}-to-${customTo}`;
      }

      const data = getPDFReportData(startDate, endDate);
      
      if (data.salesSummary.totalSales === 0 && data.purchaseSummary.totalPurchases === 0) {
        Alert.alert("No Data", "There is no sales or purchase data for the selected period.");
        return;
      }

      const html = generatePDFHtml(reportName.replace(/-/g, ' '), startDate, endDate, data);

      const { base64 } = await Print.printToFileAsync({ html, base64: true });
      
      const safeReportName = reportName.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-');
      
      if (!base64) {
        Alert.alert("Error", "Failed to generate PDF content.");
        return;
      }

      if (Platform.OS === 'android') {
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        
        if (!permissions.granted) {
          Alert.alert('Permission Denied', 'Please select a folder to save your PDF report.');
          return;
        }

        const newFileUri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          `New_Malik_Veterinary_${safeReportName}.pdf`,
          'application/pdf'
        );

        await StorageAccessFramework.writeAsStringAsync(newFileUri, base64, {
          encoding: LegacyFileSystem.EncodingType.Base64,
        });

        Alert.alert('Success', `PDF report saved successfully to the selected folder!`);
      } else {
        // Fallback for iOS
        const destFile = new File(Paths.document, `New-Malik-Veterinary-${safeReportName}.pdf`);
        if (destFile.exists) {
          await destFile.delete();
        }
        destFile.write(base64, { encoding: 'base64' });

        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
          Alert.alert("Error", "Sharing is not available on this device.");
          return;
        }
        await Sharing.shareAsync(destFile.uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Download PDF Report' });
      }
    } catch (e) {
      Alert.alert("Error", "Failed to generate PDF report.");
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View className="flex-1 bg-primary-50 p-4">
      <View className="flex-row bg-white p-1 rounded-xl mb-4 border border-gray-200">
        <TouchableOpacity 
          className={`flex-1 py-3 items-center rounded-lg ${tab === 'daily' ? 'bg-primary-600' : ''}`}
          onPress={() => setTab('daily')}
        >
          <Text className={`font-bold ${tab === 'daily' ? 'text-white' : 'text-gray-600'}`}>Daily</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 items-center rounded-lg ${tab === 'monthly' ? 'bg-primary-600' : ''}`}
          onPress={() => setTab('monthly')}
        >
          <Text className={`font-bold ${tab === 'monthly' ? 'text-white' : 'text-gray-600'}`}>Monthly</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 items-center rounded-lg ${tab === 'export' ? 'bg-primary-600' : ''}`}
          onPress={() => setTab('export')}
        >
          <Text className={`font-bold ${tab === 'export' ? 'text-white' : 'text-gray-600'}`}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      {tab === 'daily' && (
        <FlatList
          data={dailyData}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-100 flex-row justify-between items-center">
              <Text className="text-lg font-bold text-gray-800">{item.date}</Text>
              <View className="items-end">
                <Text className="text-lg font-bold text-primary-700">Rs. {item.total_sales}</Text>
                <Text className="text-green-600 font-medium text-sm">Profit: Rs. {item.total_profit}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View className="items-center justify-center py-10">
              <Text className="text-gray-500 text-lg">No daily data.</Text>
            </View>
          )}
        />
      )}

      {tab === 'monthly' && (
        <FlatList
          data={monthlyData}
          keyExtractor={(item) => item.month}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-100 flex-row justify-between items-center">
              <Text className="text-lg font-bold text-gray-800">{item.month}</Text>
              <View className="items-end">
                <Text className="text-lg font-bold text-primary-700">Rs. {item.total_sales}</Text>
                <Text className="text-green-600 font-medium text-sm">Profit: Rs. {item.total_profit}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View className="items-center justify-center py-10">
              <Text className="text-gray-500 text-lg">No monthly data.</Text>
            </View>
          )}
        />
      )}

      {tab === 'export' && (
        <ScrollView className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
          <Text className="text-xl font-bold text-gray-800 mb-4">Download PDF Report</Text>
          
          <View className="flex-row mb-6 bg-gray-100 p-1 rounded-lg">
             <TouchableOpacity 
              className={`flex-1 py-2 items-center rounded ${exportType === 'daily' ? 'bg-white' : ''}`}
              style={exportType === 'daily' ? { elevation: 1, shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } } : undefined}
              onPress={() => setExportType('daily')}
            >
              <Text className={`font-bold ${exportType === 'daily' ? 'text-primary-700' : 'text-gray-500'}`}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`flex-1 py-2 items-center rounded ${exportType === 'monthly' ? 'bg-white' : ''}`}
              style={exportType === 'monthly' ? { elevation: 1, shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } } : undefined}
              onPress={() => setExportType('monthly')}
            >
              <Text className={`font-bold ${exportType === 'monthly' ? 'text-primary-700' : 'text-gray-500'}`}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`flex-1 py-2 items-center rounded ${exportType === 'custom' ? 'bg-white' : ''}`}
              style={exportType === 'custom' ? { elevation: 1, shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } } : undefined}
              onPress={() => setExportType('custom')}
            >
              <Text className={`font-bold ${exportType === 'custom' ? 'text-primary-700' : 'text-gray-500'}`}>Custom</Text>
            </TouchableOpacity>
          </View>

          {exportType === 'daily' && (
            <View className="mb-6">
              <Text className="text-sm font-bold text-gray-600 mb-2 uppercase">Select Date</Text>
              <TouchableOpacity 
                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                onPress={() => setShowDailyPicker(true)}
              >
                <Text className="text-base text-gray-800">{formatDateForDisplay(dailyDate)}</Text>
              </TouchableOpacity>
              {showDailyPicker && (
                <DateTimePicker
                  value={dailyDateObj}
                  mode="date"
                  display="default"
                  onChange={onDailyChange}
                />
              )}
            </View>
          )}

          {exportType === 'monthly' && (
            <View className="mb-6">
              <Text className="text-sm font-bold text-gray-600 mb-2 uppercase">Select Month</Text>
              <TouchableOpacity 
                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                onPress={() => setShowMonthlyPicker(true)}
              >
                <Text className="text-base text-gray-800">{formatMonthForDisplay(monthlyMonth)}</Text>
              </TouchableOpacity>
              {showMonthlyPicker && (
                <DateTimePicker
                  value={monthlyDateObj}
                  mode="date"
                  display="default"
                  onChange={onMonthlyChange}
                />
              )}
            </View>
          )}

          {exportType === 'custom' && (
            <View className="mb-6">
              <View className="mb-4">
                <Text className="text-sm font-bold text-gray-600 mb-2 uppercase">Date From</Text>
                <TouchableOpacity 
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  onPress={() => setShowCustomFromPicker(true)}
                >
                  <Text className="text-base text-gray-800">{customFrom ? formatDateForDisplay(customFrom) : 'Select Date From'}</Text>
                </TouchableOpacity>
                {showCustomFromPicker && (
                  <DateTimePicker
                    value={customFromObj}
                    mode="date"
                    display="default"
                    onChange={onCustomFromChange}
                  />
                )}
              </View>
              <View>
                <Text className="text-sm font-bold text-gray-600 mb-2 uppercase">Date To</Text>
                <TouchableOpacity 
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  onPress={() => setShowCustomToPicker(true)}
                >
                  <Text className="text-base text-gray-800">{customTo ? formatDateForDisplay(customTo) : 'Select Date To'}</Text>
                </TouchableOpacity>
                {showCustomToPicker && (
                  <DateTimePicker
                    value={customToObj}
                    mode="date"
                    display="default"
                    minimumDate={customFromObj} // Prevent selecting dates before Custom From
                    onChange={onCustomToChange}
                  />
                )}
              </View>
            </View>
          )}

          <TouchableOpacity 
            className={`p-4 rounded-xl items-center mt-4 flex-row justify-center ${isExporting ? 'bg-primary-400' : 'bg-primary-600'}`}
            onPress={handleDownloadPDF}
            disabled={isExporting}
          >
            {isExporting ? <Text className="text-white font-bold text-lg mr-2">Generating...</Text> : <Text className="text-white font-bold text-lg">Generate & Download PDF</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
