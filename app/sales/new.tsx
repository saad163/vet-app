import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { createSale, NewSaleItemInput } from "../../src/db/sales";
import { getProducts, searchProducts } from "../../src/db/products";
import { ProductWithStock } from "../../src/types";
import { Plus, X, Search } from "lucide-react-native";

export default function NewSale() {
  const router = useRouter();
  
  const [saleDate, setSaleDate] = useState(new Date().toISOString());
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<NewSaleItemInput[]>([]);
  
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  
  const [currentItem, setCurrentItem] = useState<Partial<NewSaleItemInput>>({});
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setProducts(searchProducts(searchQuery));
    } else {
      setProducts(getProducts());
    }
  }, [searchQuery, isProductModalOpen]);

  const handleSaveSale = () => {
    if (items.length === 0) {
      Alert.alert("Error", "Please add at least one item.");
      return;
    }

    try {
      createSale(null, saleDate, notes, items);
      Alert.alert("Success", "Sale recorded successfully!");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save sale.");
    }
  };

  const handleAddItem = () => {
    if (!currentItem.product_id || !currentItem.quantity || !currentItem.selling_price || !selectedProduct) {
      Alert.alert("Error", "Please fill all required item fields.");
      return;
    }

    if (currentItem.quantity > selectedProduct.total_stock) {
      Alert.alert("Insufficient Stock", `Only ${selectedProduct.total_stock} units available.`);
      return;
    }

    if (currentItem.selling_price < selectedProduct.min_selling_price) {
      Alert.alert("Invalid Price", `Selling price cannot be lower than the minimum selling price of Rs. ${selectedProduct.min_selling_price}.`);
      return;
    }

    if (currentItem.selling_price > selectedProduct.max_selling_price) {
      Alert.alert("Invalid Price", `Selling price cannot be higher than the maximum selling price of Rs. ${selectedProduct.max_selling_price}.`);
      return;
    }

    setItems([...items, currentItem as NewSaleItemInput]);
    setCurrentItem({});
    setSelectedProduct(null);
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 p-4">
        <View className="bg-gray-50 p-4 rounded-xl mb-6">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Notes</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-lg p-3 text-base text-gray-900"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <Text className="text-lg font-bold text-gray-800 mb-3">Sale Items</Text>
        
        {items.map((item, index) => (
          <View key={index} className="bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row justify-between">
              <Text className="font-bold text-lg">{item.product_name}</Text>
              <TouchableOpacity onPress={() => setItems(items.filter((_, i) => i !== index))}>
                <X color="red" size={20} />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-600">Qty: {item.quantity}</Text>
            <Text className="text-gray-600">Price: Rs. {item.selling_price} (Subtotal: Rs. {item.selling_price * item.quantity})</Text>
          </View>
        ))}

        <View className="bg-primary-50 p-4 rounded-xl mb-8 border border-primary-100">
          <Text className="font-bold text-primary-800 mb-3">Add Item</Text>
          
          <TouchableOpacity 
            className="bg-white border border-gray-200 rounded-lg p-3 mb-2"
            onPress={() => setProductModalOpen(true)}
          >
            <Text className={currentItem.product_name ? "text-black" : "text-gray-400"}>
              {currentItem.product_name || "Select Product *"}
            </Text>
          </TouchableOpacity>

          {selectedProduct && (
            <Text className="text-xs text-gray-500 mb-4 ml-1">
              Stock: {selectedProduct.total_stock} | Min Rs. {selectedProduct.min_selling_price} - Max Rs. {selectedProduct.max_selling_price}
            </Text>
          )}

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
              placeholder="Selling Price (Rs) *"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={currentItem.selling_price?.toString() || ""}
              onChangeText={(t) => setCurrentItem({...currentItem, selling_price: parseFloat(t) || 0})}
            />
          </View>

          <TouchableOpacity 
            className="bg-primary-600 p-3 rounded-lg mt-4 items-center flex-row justify-center"
            onPress={handleAddItem}
          >
            <Plus color="white" size={20} />
            <Text className="text-white font-bold ml-2">Add to Sale</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-gray-200 bg-white">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold">Total Amount:</Text>
          <Text className="text-2xl font-bold text-primary-700">
            Rs. {items.reduce((s, i) => s + (i.selling_price * i.quantity), 0)}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-green-600 p-4 rounded-xl items-center"
          onPress={handleSaveSale}
        >
          <Text className="text-white font-bold text-lg">Confirm Sale</Text>
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
          
          <View className="flex-row items-center mb-4 bg-gray-100 rounded-xl p-2 px-4">
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
            keyExtractor={(i) => i.id.toString()}
            renderItem={({item}) => (
              <TouchableOpacity 
                className={`p-4 border-b border-gray-100 ${item.total_stock <= 0 ? 'opacity-50' : ''}`}
                disabled={item.total_stock <= 0}
                onPress={() => {
                  setSelectedProduct(item);
                  setCurrentItem({
                    ...currentItem, 
                    product_id: item.id, 
                    product_name: item.name,
                    selling_price: item.min_selling_price // default to min price
                  });
                  setProductModalOpen(false);
                }}
              >
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-lg font-bold">{item.name}</Text>
                    <Text className="text-gray-500">Stock: {item.total_stock} {item.unit}</Text>
                  </View>
                  <Text className="text-gray-600 text-xs">Rs. {item.min_selling_price} - Rs. {item.max_selling_price}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}
