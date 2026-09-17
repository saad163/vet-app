import { View, Text, FlatList } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { getProductReport, ProductReport } from "../../src/db/reports";
import { Package } from "lucide-react-native";

export default function ProductsReport() {
  const [data, setData] = useState<ProductReport[]>([]);

  useFocusEffect(
    useCallback(() => {
      setData(getProductReport());
    }, [])
  );

  return (
    <View className="flex-1 bg-primary-50 p-4">
      <FlatList
        data={data}
        keyExtractor={(item) => item.product_id.toString()}
        renderItem={({ item, index }) => (
          <View className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-100 flex-row items-center">
            <View className="bg-primary-100 w-10 h-10 rounded-full items-center justify-center mr-4">
              <Text className="text-primary-800 font-bold">{index + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-800" numberOfLines={1}>{item.product_name}</Text>
              <Text className="text-gray-500">Sold: {item.total_quantity_sold} units</Text>
            </View>
            <View className="items-end">
              <Text className="text-base font-bold text-gray-800">Rs. {item.total_revenue}</Text>
              <Text className="text-green-600 font-medium text-xs">Profit: Rs. {item.total_profit}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-10">
            <Package size={48} color="#9ca3af" className="mb-4" />
            <Text className="text-gray-500 text-lg">No product sales data yet.</Text>
          </View>
        )}
      />
    </View>
  );
}
