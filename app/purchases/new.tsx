import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { createPurchase, NewPurchaseItem } from "../../src/db/purchases";
import { getProducts } from "../../src/db/products";
import { ProductWithStock } from "../../src/types";
import { format } from "date-fns";
import { Plus, X, Search } from "lucide-react-native";

export default function NewPurchase() {
  const router = useRouter();
  
  const [supplier, setSupplier] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString());
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<(NewPurchaseItem & { productName: string })[]>([]);
  
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  
  const [currentItem, setCurrentItem] = useState<Partial<NewPurchaseItem & { productName: string }>>({});

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const handleSavePurchase = () => {
    if (items.length === 0) {
      Alert.alert("Error", "Please add at least one item.");
      return;
    }

    try {
      createPurchase(supplier, purchaseDate, notes, items);
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save purchase.");
      console.error(e);
    }
  };

  const handleAddItem = () => {
    if (!currentItem.product_id || !currentItem.quantity || !currentItem.purchase_price) {
      Alert.alert("Error", "Please fill all required item fields.");
      return;
    }

    setItems([...items, currentItem as (NewPurchaseItem & { productName: string })]);
    setCurrentItem({});
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 p-4">
        
        <View className="bg-gray-50 p-4 rounded-xl mb-6">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Supplier</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-900"
            value={supplier}
            onChangeText={setSupplier}
            placeholder="Supplier Name"
            placeholderTextColor="#9ca3af"
          />
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Notes</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-lg p-3 text-base text-gray-900"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <Text className="text-lg font-bold text-gray-800 mb-3">Purchase Items</Text>
        
        {items.map((item, index) => (
          <View key={index} className="bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row justify-between">
              <Text className="font-bold text-lg">{item.productName}</Text>
              <TouchableOpacity onPress={() => setItems(items.filter((_, i) => i !== index))}>
                <X color="red" size={20} />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-600">Qty: {item.quantity}</Text>
            <Text className="text-gray-600">Price: Rs. {item.purchase_price} (Subtotal: Rs. {item.purchase_price * item.quantity})</Text>
          </View>
        ))}

        <View className="bg-primary-50 p-4 rounded-xl mb-8">
          <Text className="font-bold text-primary-800 mb-3">Add Item</Text>
          
          <TouchableOpacity 
            className="bg-white border border-gray-200 rounded-lg p-3 mb-4"
            onPress={() => setProductModalOpen(true)}
          >
            <Text className={currentItem.productName ? "text-black" : "text-gray-400"}>
              {currentItem.productName || "Select Product *"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-between">
            <TextInput
              className="bg-white border border-gray-200 rounded-lg p-3 mb-4 w-[100%] text-gray-900"
              placeholder="Expiry (YYYY-MM-DD)"
              placeholderTextColor="#9ca3af"
              value={currentItem.expiry_date || ""}
              onChangeText={(t) => setCurrentItem({...currentItem, expiry_date: t})}
            />
          </View>

          <View className="flex-row justify-between">
            <TextInput
              className="bg-white border border-gray-200 rounded-lg p-3 w-[48%] text-gray-900"
              placeholder="Quantity *"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={currentItem.quantity?.toString() || ""}
              onChangeText={(t) => setCurrentItem({...currentItem, quantity: parseInt(t) || 0})}
            />
            <TextInput
              className="bg-white border border-gray-200 rounded-lg p-3 w-[48%] text-gray-900"
              placeholder="Unit Price (Rs) *"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={currentItem.purchase_price?.toString() || ""}
              onChangeText={(t) => setCurrentItem({...currentItem, purchase_price: parseFloat(t) || 0})}
            />
          </View>

          <TouchableOpacity 
            className="bg-primary-600 p-3 rounded-lg mt-4 items-center flex-row justify-center"
            onPress={handleAddItem}
          >
            <Plus color="white" size={20} />
            <Text className="text-white font-bold ml-2">Add to List</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-gray-200 bg-white">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold">Total Amount:</Text>
          <Text className="text-2xl font-bold text-primary-700">
            Rs. {items.reduce((s, i) => s + (i.purchase_price * i.quantity), 0)}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-green-600 p-4 rounded-xl items-center"
          onPress={handleSavePurchase}
        >
          <Text className="text-white font-bold text-lg">Save Purchase</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isProductModalOpen} animationType="slide">
        <View className="flex-1 bg-white pt-10 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Select Product</Text>
            <TouchableOpacity onPress={() => setProductModalOpen(false)}>
              <X color="black" size={24} />
            </TouchableOpacity>
          </View>
          <FlatList 
            data={products}
            keyExtractor={(i) => i.id.toString()}
            renderItem={({item}) => (
              <TouchableOpacity 
                className="p-4 border-b border-gray-100"
                onPress={() => {
                  setCurrentItem({...currentItem, product_id: item.id, productName: item.name});
                  setProductModalOpen(false);
                }}
              >
                <Text className="text-lg font-bold">{item.name}</Text>
                <Text className="text-gray-500">Stock: {item.total_stock}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}
