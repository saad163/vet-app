import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useState, useCallback } from "react";
import { Link, useFocusEffect } from "expo-router";
import { getReturns } from "../../src/db/returns";
import { format } from "date-fns";
import { RotateCcw } from "lucide-react-native";

export default function ReturnsList() {
  const [returns, setReturns] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      setReturns(getReturns());
    }, [])
  );

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <FlatList
        data={returns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Link href={`/sales/${item.sale_id}`} asChild>
            <TouchableOpacity className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text className="text-lg font-bold text-gray-800">
                    RET-{item.id.toString().padStart(4, '0')}
                  </Text>
                  <Text className="text-gray-500">
                    {format(new Date(item.return_date), "dd MMM yyyy HH:mm")}
                  </Text>
                </View>
                <View className="items-end bg-red-100 px-2 py-1 rounded-md">
                  <Text className="text-red-800 font-bold">Refund: Rs. {item.total_refund}</Text>
                </View>
              </View>
              <View className="flex-row justify-between pt-2 border-t border-gray-100">
                <Text className="text-gray-600">Original Sale: #{item.sale_id}</Text>
                <Text className="text-gray-600">{item.item_count} items</Text>
              </View>
              {item.reason && (
                <Text className="text-gray-500 italic mt-2">"{item.reason}"</Text>
              )}
            </TouchableOpacity>
          </Link>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-10 mt-10">
            <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-4">
              <RotateCcw size={40} color="#9ca3af" />
            </View>
            <Text className="text-gray-500 text-lg font-medium">No returns recorded yet.</Text>
          </View>
        )}
      />
    </View>
  );
}
