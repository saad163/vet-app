import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { getDailyReport, getMonthlyReport, DailyReport, MonthlyReport } from "../../src/db/reports";

export default function DailyMonthlyReports() {
  const [tab, setTab] = useState<'daily' | 'monthly'>('daily');
  const [dailyData, setDailyData] = useState<DailyReport[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyReport[]>([]);

  useFocusEffect(
    useCallback(() => {
      setDailyData(getDailyReport());
      setMonthlyData(getMonthlyReport());
    }, [])
  );

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
      </View>

      {tab === 'daily' ? (
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
      ) : (
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
    </View>
  );
}
