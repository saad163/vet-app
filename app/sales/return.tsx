import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useState, useCallback } from "react";
import { useLocalSearchParams, Stack, useRouter, useFocusEffect } from "expo-router";
import { getSaleDetails, SaleDetails, SaleDetailItem } from "../../src/db/sales";
import { processReturn } from "../../src/db/returns";
import { ArrowLeft, CheckCircle2 } from "lucide-react-native";

export default function ProcessReturnScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sale, setSale] = useState<SaleDetails | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [reason, setReason] = useState("");
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (id) {
        const saleData = getSaleDetails(Number(id));
        setSale(saleData);
        if (saleData) {
          const initialQtys: Record<number, number> = {};
          saleData.items.forEach(item => {
            initialQtys[item.id] = 0;
          });
          setReturnQuantities(initialQtys);
        }
      }
    }, [id])
  );

  if (!sale) return null;

  const updateQuantity = (itemId: number, change: number, maxAllowed: number) => {
    setReturnQuantities(prev => {
      const current = prev[itemId] || 0;
      const next = current + change;
      if (next >= 0 && next <= maxAllowed) {
        return { ...prev, [itemId]: next };
      }
      return prev;
    });
  };

  const totalRefundAmount = sale.items.reduce((sum, item) => {
    return sum + (returnQuantities[item.id] || 0) * item.selling_price;
  }, 0);

  const handleReturn = () => {
    if (totalRefundAmount === 0) {
      Alert.alert("Error", "Please select at least one item to return.");
      return;
    }

    Alert.alert(
      "Confirm Return",
      `Are you sure you want to process a return of Rs. ${totalRefundAmount}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            try {
              const itemsToReturn = sale.items.map(item => ({
                sale_item_id: item.id,
                product_id: item.product_id,
                quantity: returnQuantities[item.id] || 0,
                selling_price: item.selling_price,
                profit_per_unit: item.profit_per_unit,
              })).filter(i => i.quantity > 0);

              processReturn(sale.id, itemsToReturn, reason || "Customer Return", null);
              
              Alert.alert("Success", "Return processed successfully.", [
                { text: "OK", onPress: () => router.back() }
              ]);
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen 
        options={{
          title: "Process Return",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="#1f2937" />
            </TouchableOpacity>
          )
        }} 
      />

      <ScrollView className="flex-1 p-4">
        <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <Text className="text-gray-500 mb-2">Return Reason</Text>
          <TextInput
            className="border border-gray-200 rounded-lg p-3 text-gray-800 bg-gray-50"
            placeholder="E.g. Defective, Changed mind, Wrong item..."
            value={reason}
            onChangeText={setReason}
          />
        </View>

        <Text className="text-lg font-bold text-gray-800 mb-2">Select Items to Return</Text>

        {sale.items.map((item, index) => {
          const availableToReturn = item.quantity - item.returned_quantity;
          if (availableToReturn <= 0) return null;

          const qty = returnQuantities[item.id] || 0;

          return (
            <View key={index} className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <Text className="font-bold text-gray-800 text-base mb-1">{item.product_name}</Text>
              <Text className="text-gray-500 mb-3 text-sm">
                Max available to return: {availableToReturn}
              </Text>
              
              <View className="flex-row justify-between items-center">
                <Text className="font-bold text-primary-700">Rs. {qty * item.selling_price}</Text>
                
                <View className="flex-row items-center bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  <TouchableOpacity 
                    className="px-4 py-2 bg-gray-100"
                    onPress={() => updateQuantity(item.id, -1, availableToReturn)}
                  >
                    <Text className="text-xl text-gray-600 font-medium">-</Text>
                  </TouchableOpacity>
                  <Text className="px-4 text-lg font-bold text-gray-800">{qty}</Text>
                  <TouchableOpacity 
                    className="px-4 py-2 bg-gray-100"
                    onPress={() => updateQuantity(item.id, 1, availableToReturn)}
                  >
                    <Text className="text-xl text-gray-600 font-medium">+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-200">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-gray-600 font-medium text-lg">Total Refund:</Text>
          <Text className="text-2xl font-bold text-red-600">Rs. {totalRefundAmount}</Text>
        </View>
        <TouchableOpacity 
          className={`flex-row items-center justify-center py-4 rounded-xl ${totalRefundAmount > 0 ? 'bg-red-500' : 'bg-gray-300'}`}
          onPress={handleReturn}
          disabled={totalRefundAmount === 0}
        >
          <CheckCircle2 size={20} color="white" className="mr-2" />
          <Text className="text-white font-bold text-lg">Confirm Return</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
