import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useState, useCallback } from "react";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { getSaleDetails, SaleDetails } from "../../src/db/sales";
import { format } from "date-fns";
import { ArrowLeft, RotateCcw } from "lucide-react-native";

export default function SaleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sale, setSale] = useState<SaleDetails | null>(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (id) {
        setSale(getSaleDetails(Number(id)));
      }
    }, [id])
  );

  if (!sale) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Loading sale details...</Text>
      </View>
    );
  }

  const fullyReturned = sale.status === 'FULLY_RETURNED';

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen 
        options={{
          title: `Sale #${sale.id}`,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="#1f2937" />
            </TouchableOpacity>
          )
        }} 
      />

      <ScrollView className="flex-1 p-4">
        <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <Text className="text-gray-500 mb-1">Date</Text>
          <Text className="text-lg font-bold text-gray-800 mb-4">
            {format(new Date(sale.sale_date), "dd MMM yyyy HH:mm")}
          </Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Customer</Text>
            <Text className="font-medium">{sale.customer_name || 'Walk-in'}</Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Gross Total</Text>
            <Text className="font-bold text-primary-700">Rs. {sale.total_amount}</Text>
          </View>
          
          {(sale.returned_amount || 0) > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Returned Amount</Text>
              <Text className="font-bold text-red-600">- Rs. {sale.returned_amount}</Text>
            </View>
          )}
          
          <View className="flex-row justify-between pt-2 border-t border-gray-100">
            <Text className="text-gray-800 font-bold">Net Total</Text>
            <Text className="font-bold text-primary-700 text-lg">
              Rs. {sale.total_amount - (sale.returned_amount || 0)}
            </Text>
          </View>
          
          {sale.status && sale.status !== 'COMPLETED' && (
            <View className="mt-4 bg-amber-100 self-start px-3 py-1 rounded-md">
              <Text className="text-amber-800 text-sm font-bold">
                {sale.status.replace('_', ' ')}
              </Text>
            </View>
          )}
        </View>

        <Text className="text-lg font-bold text-gray-800 mb-2 mt-2">Items</Text>
        
        {sale.items.map((item, index) => (
          <View key={index} className="bg-white p-4 rounded-xl shadow-sm mb-3">
            <View className="flex-row justify-between mb-2">
              <Text className="font-bold text-gray-800 text-base">{item.product_name}</Text>
              <Text className="font-bold text-primary-700">Rs. {item.subtotal}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500">
                {item.quantity} x Rs. {item.selling_price}
              </Text>
              {item.returned_quantity > 0 && (
                <Text className="text-red-500 text-sm font-medium">
                  Returned: {item.returned_quantity}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {!fullyReturned && (
        <View className="p-4 bg-white border-t border-gray-200">
          <TouchableOpacity 
            className="bg-amber-500 flex-row items-center justify-center py-4 rounded-xl"
            onPress={() => router.push(`/sales/return?id=${sale.id}`)}
          >
            <RotateCcw size={20} color="white" className="mr-2" />
            <Text className="text-white font-bold text-lg">Return Items</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
