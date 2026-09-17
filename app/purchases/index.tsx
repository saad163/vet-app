import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useState, useCallback } from "react";
import { Link, useFocusEffect } from "expo-router";
import { getPurchases } from "../../src/db/purchases";
import { Purchase } from "../../src/types";
import { Plus } from "lucide-react-native";
import { format } from "date-fns";

export default function PurchasesList() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useFocusEffect(
    useCallback(() => {
      setPurchases(getPurchases());
    }, [])
  );

  return (
    <View className="flex-1 bg-primary-50 p-4">
      <FlatList
        data={purchases}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity className="bg-white p-4 rounded-xl shadow-sm mb-3">
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-lg font-bold text-gray-800">
                  {format(new Date(item.purchase_date), "dd MMM yyyy")}
                </Text>
                <Text className="text-gray-500">{item.supplier || "Unknown Supplier"}</Text>
              </View>
              <Text className="text-lg font-bold text-primary-700">Rs. {item.total_amount}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-10">
            <Text className="text-gray-500 text-lg">No purchases recorded yet.</Text>
          </View>
        )}
      />

      <Link href="/purchases/new" asChild>
        <TouchableOpacity className="absolute bottom-6 right-6 bg-primary-600 w-16 h-16 rounded-full items-center justify-center shadow-lg">
          <Plus size={32} color="white" />
        </TouchableOpacity>
      </Link>
    </View>
  );
}
