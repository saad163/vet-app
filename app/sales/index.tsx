import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useState, useCallback } from "react";
import { Link, useFocusEffect } from "expo-router";
import { getSales } from "../../src/db/sales";
import { Sale } from "../../src/types";
import { Plus } from "lucide-react-native";
import { format } from "date-fns";

export default function SalesList() {
  const [sales, setSales] = useState<Sale[]>([]);

  useFocusEffect(
    useCallback(() => {
      setSales(getSales() as Sale[]);
    }, [])
  );

  return (
    <View className="flex-1 bg-primary-50 p-4">
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Link href={`/sales/${item.id}`} asChild>
            <TouchableOpacity className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="text-lg font-bold text-gray-800">
                    {format(new Date(item.sale_date), "dd MMM yyyy HH:mm")}
                  </Text>
                  <Text className="text-gray-500">ID: #{item.id}</Text>
                  {item.status && item.status !== 'COMPLETED' && (
                    <View className="mt-1 bg-amber-100 self-start px-2 py-1 rounded-md">
                      <Text className="text-amber-800 text-xs font-bold">
                        {item.status.replace('_', ' ')}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="items-end">
                  <Text className="text-lg font-bold text-primary-700">Rs. {item.total_amount}</Text>
                  <Text className="text-green-600 font-medium text-sm">Profit: Rs. {item.total_profit}</Text>
                  {(item.returned_amount || 0) > 0 && (
                    <Text className="text-red-600 font-medium text-xs mt-1">
                      Returned: Rs. {item.returned_amount}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-10">
            <Text className="text-gray-500 text-lg">No sales recorded yet.</Text>
          </View>
        )}
      />

      <Link href="/sales/new" asChild>
        <TouchableOpacity className="absolute bottom-6 right-6 bg-primary-600 w-16 h-16 rounded-full items-center justify-center shadow-lg">
          <Plus size={32} color="white" />
        </TouchableOpacity>
      </Link>
    </View>
  );
}
