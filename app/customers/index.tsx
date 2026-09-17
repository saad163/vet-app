import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useState, useCallback } from "react";
import { Link, useFocusEffect } from "expo-router";
import { getCustomers } from "../../src/db/customers";
import { Customer } from "../../src/types";
import { Plus } from "lucide-react-native";

export default function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useFocusEffect(
    useCallback(() => {
      setCustomers(getCustomers());
    }, [])
  );

  return (
    <View className="flex-1 bg-primary-50 p-4">
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-xl shadow-sm mb-3">
            <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
            <Text className="text-gray-500">{item.phone || "No phone"}</Text>
            {item.address && <Text className="text-gray-500 mt-1">{item.address}</Text>}
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-10">
            <Text className="text-gray-500 text-lg">No customers recorded yet.</Text>
          </View>
        )}
      />

      <Link href="/customers/new" asChild>
        <TouchableOpacity className="absolute bottom-6 right-6 bg-primary-600 w-16 h-16 rounded-full items-center justify-center shadow-lg">
          <Plus size={32} color="white" />
        </TouchableOpacity>
      </Link>
    </View>
  );
}
