import { View, Text, FlatList, TouchableOpacity, TextInput } from "react-native";
import { useEffect, useState } from "react";
import { Link, useFocusEffect } from "expo-router";
import { getProducts, searchProducts } from "../../src/db/products";
import { ProductWithStock } from "../../src/types";
import { useCallback } from "react";
import { Search, Plus } from "lucide-react-native";

export default function ProductsList() {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadProducts = useCallback(() => {
    if (searchQuery.trim().length > 0) {
      setProducts(searchProducts(searchQuery));
    } else {
      setProducts(getProducts());
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  return (
    <View className="flex-1 bg-primary-50 p-4">
      <View className="flex-row items-center mb-4 bg-white rounded-xl p-2 px-4 shadow-sm">
        <Search size={20} color="#6b7280" />
        <TextInput
          className="flex-1 ml-2 text-base h-10 text-gray-900"
          placeholder="Search products..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Link href={`/products/${item.id}`} asChild>
            <TouchableOpacity className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
                  <Text className="text-gray-500">{item.brand} • {item.category}</Text>
                  <Text className="text-gray-700 mt-1 font-medium">Rs. {item.min_selling_price} - Rs. {item.max_selling_price}</Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${item.total_stock <= item.min_stock_alert ? 'bg-red-100' : 'bg-green-100'}`}>
                  <Text className={`font-bold ${item.total_stock <= item.min_stock_alert ? 'text-red-700' : 'text-green-700'}`}>
                    {item.total_stock} {item.unit}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-10">
            <Text className="text-gray-500 text-lg">No products found.</Text>
          </View>
        )}
      />

      <Link href="/products/new" asChild>
        <TouchableOpacity className="absolute bottom-6 right-6 bg-primary-600 w-16 h-16 rounded-full items-center justify-center shadow-lg">
          <Plus size={32} color="white" />
        </TouchableOpacity>
      </Link>
    </View>
  );
}
