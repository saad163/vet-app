import { View, Text, FlatList } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { getAlerts, AlertItem } from "../../src/db/dashboard";
import { AlertCircle, AlertTriangle, Clock } from "lucide-react-native";

export default function AlertsList() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      setAlerts(getAlerts());
    }, [])
  );

  const getAlertIcon = (type: string) => {
    switch(type) {
      case 'OUT_OF_STOCK': return <AlertCircle size={24} color="#ef4444" />;
      case 'LOW_STOCK': return <AlertTriangle size={24} color="#f59e0b" />;
      case 'EXPIRING': return <Clock size={24} color="#3b82f6" />;
      default: return <AlertCircle size={24} color="#6b7280" />;
    }
  };

  const getAlertBg = (type: string) => {
    switch(type) {
      case 'OUT_OF_STOCK': return "bg-red-50 border-red-200";
      case 'LOW_STOCK': return "bg-orange-50 border-orange-200";
      case 'EXPIRING': return "bg-blue-50 border-blue-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className={`p-4 rounded-xl mb-3 border ${getAlertBg(item.type)} flex-row items-center`}>
            <View className="mr-4">
              {getAlertIcon(item.type)}
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-800">{item.productName}</Text>
              <Text className="text-gray-600">{item.message}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-10">
            <Text className="text-gray-500 text-lg">No alerts at this time. All good!</Text>
          </View>
        )}
      />
    </View>
  );
}
