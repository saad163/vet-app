import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { getAlerts, AlertItem } from "../../src/db/dashboard";
import { getProductById, updateProduct } from "../../src/db/products";
import { Product } from "../../src/types";

export default function EditAlertDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [alert, setAlert] = useState<AlertItem | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [minSellingPrice, setMinSellingPrice] = useState("");
  const [maxSellingPrice, setMaxSellingPrice] = useState("");
  const [minStockAlert, setMinStockAlert] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [totalStock, setTotalStock] = useState("");

  useEffect(() => {
    if (id) {
      const allAlerts = getAlerts();
      const currentAlert = allAlerts.find(a => a.id === id);
      if (currentAlert) {
        setAlert(currentAlert);
        const prod = getProductById(currentAlert.productId);
        if (prod) {
          setProduct(prod);
          setName(prod.name);
          setCategory(prod.category || "");
          setBrand(prod.brand || "");
          setMinSellingPrice(prod.min_selling_price.toString());
          setMaxSellingPrice(prod.max_selling_price.toString());
          setMinStockAlert(prod.min_stock_alert.toString());
          setTotalStock(prod.total_stock.toString());
          setExpiryDate(prod.expiry_date || "");
        }
      } else {
        Alert.alert("Not Found", "Alert details no longer exist.");
        router.back();
      }
    }
  }, [id]);

  const handleSave = () => {
    if (!product) return;

    // Validate Product
    const minPrice = parseFloat(minSellingPrice);
    const maxPrice = parseFloat(maxSellingPrice);
    const stock = parseInt(totalStock);
    if (!name || isNaN(minPrice) || isNaN(maxPrice) || minPrice > maxPrice || isNaN(stock) || stock < 0) {
      Alert.alert("Error", "Please verify product details and valid pricing/stock.");
      return;
    }

    try {
      // 1. Update Product
      updateProduct(product.id, {
        name,
        category,
        brand,
        description: product.description,
        unit: product.unit,
        min_selling_price: minPrice,
        max_selling_price: maxPrice,
        min_stock_alert: parseInt(minStockAlert) || 0,
        total_stock: stock,
        expiry_date: expiryDate
      });

      Alert.alert("Success", "Details updated successfully!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to update details.");
      console.error(error);
    }
  };

  if (!alert || !product) {
    return <View className="flex-1 bg-primary-50" />;
  }

  const isExpiryAlert = alert.type === 'EXPIRED' || alert.type === 'NEAR_EXPIRY';
  const headerTitle = isExpiryAlert ? "Edit Expiry Alert" : "Edit Stock Alert";

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Stack.Screen options={{ title: headerTitle }} />
      
      <View className={`p-4 rounded-xl mb-6 border ${isExpiryAlert ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
        <Text className="font-bold text-lg mb-1 text-gray-900">{alert.productName}</Text>
        <Text className="text-gray-700">{alert.message}</Text>
      </View>

      <Text className="text-xl font-bold text-teal-800 mb-4">Product Details</Text>
      
      <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Name *</Text>
      <TextInput
        className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-800"
        value={name}
        onChangeText={setName}
      />

      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Category</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-800"
            value={category}
            onChangeText={setCategory}
          />
        </View>
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Brand</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-800"
            value={brand}
            onChangeText={setBrand}
          />
        </View>
      </View>

      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Total Stock</Text>
          <TextInput
            className={`${isExpiryAlert ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-300'} border rounded-lg p-3 mb-4 text-base text-gray-800 font-bold`}
            value={totalStock}
            onChangeText={setTotalStock}
            keyboardType="numeric"
          />
        </View>
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Min Stock Alert</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-800"
            value={minStockAlert}
            onChangeText={setMinStockAlert}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Expiry Date</Text>
          <TextInput
            className={`${isExpiryAlert ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200'} border rounded-lg p-3 mb-4 text-base text-gray-900 font-bold`}
            value={expiryDate}
            onChangeText={setExpiryDate}
            placeholder="e.g. 2024-12-31"
          />
        </View>
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Min Sell Price</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-800"
            value={minSellingPrice}
            onChangeText={setMinSellingPrice}
            keyboardType="numeric"
          />
        </View>
      </View>

      <TouchableOpacity
        className="bg-teal-600 p-4 rounded-xl items-center mt-4 mb-10 shadow-sm"
        onPress={handleSave}
      >
        <Text className="text-white font-bold text-lg">Save & Resolve Alert</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
