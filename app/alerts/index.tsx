import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect, Stack, useRouter } from "expo-router";
import { getAlerts, AlertItem } from "../../src/db/dashboard";
import { AlertCircle, AlertTriangle, Clock, Edit2, CheckCircle2 } from "lucide-react-native";

export default function AlertsList() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setAlerts(getAlerts());
    }, [])
  );

  return (
    <View className="flex-1 bg-primary-50 p-4">
      <Stack.Screen options={{ title: "All Alerts" }} />
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          let icon, bgColor, textColor;
          if (item.type === 'EXPIRED') {
            icon = <AlertCircle size={24} color="#dc2626" />;
            bgColor = "bg-red-50 border-red-200";
            textColor = "text-red-700";
          } else if (item.type === 'OUT_OF_STOCK') {
            icon = <AlertCircle size={24} color="#dc2626" />;
            bgColor = "bg-red-50 border-red-200";
            textColor = "text-red-700";
          } else if (item.type === 'NEAR_EXPIRY') {
            icon = <Clock size={24} color="#ea580c" />;
            bgColor = "bg-orange-50 border-orange-200";
            textColor = "text-orange-700";
          } else {
            // LOW_STOCK
            icon = <AlertTriangle size={24} color="#ea580c" />;
            bgColor = "bg-orange-50 border-orange-200";
            textColor = "text-orange-700";
          }

          return (
            <TouchableOpacity 
              className={`p-4 rounded-xl mb-3 border ${bgColor} flex-row items-center`}
              onPress={() => router.push(`/alerts/${item.id}`)}
            >
              <View className="mr-4">
                {icon}
              </View>
              <View className="flex-1">
                <Text className={`text-lg font-bold ${textColor}`}>{item.productName}</Text>
                <Text className={`${textColor} opacity-90`}>{item.message}</Text>
              </View>
              <View className="ml-2 bg-white p-2 rounded-full opacity-90 shadow-sm border border-gray-100">
                <Edit2 size={20} color={item.type === 'EXPIRED' || item.type === 'OUT_OF_STOCK' ? '#dc2626' : '#ea580c'} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-10 mt-10 bg-white rounded-2xl p-6 border border-gray-100">
            <CheckCircle2 size={48} color="#10b981" className="mb-4" />
            <Text className="text-gray-800 text-xl font-bold mb-2">All Good!</Text>
            <Text className="text-gray-500 text-center">There are no critical alerts at this time.</Text>
          </View>
        )}
      />
    </View>
  );
}
