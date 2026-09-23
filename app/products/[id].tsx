import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getProductById, updateProduct, deactivateProduct } from "../../src/db/products";

export default function EditProduct() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [form, setForm] = useState({
    name: "",
    category: "",
    brand: "",
    description: "",
    unit: "",
    min_selling_price: "",
    max_selling_price: "",
    min_stock_alert: "",
    total_stock: 0,
  });

  useEffect(() => {
    if (id) {
      const product = getProductById(Number(id));
      if (product) {
        setForm({
          name: product.name,
          category: product.category || "",
          brand: product.brand || "",
          description: product.description || "",
          unit: product.unit || "",
          min_selling_price: product.min_selling_price.toString(),
          max_selling_price: product.max_selling_price.toString(),
          min_stock_alert: product.min_stock_alert.toString(),
          total_stock: product.total_stock,
        });
      }
    }
  }, [id]);

  const handleSave = () => {
    if (!form.name || !form.min_selling_price || !form.max_selling_price) {
      Alert.alert("Error", "Name, min selling price and max selling price are required.");
      return;
    }

    const minPrice = parseFloat(form.min_selling_price);
    const maxPrice = parseFloat(form.max_selling_price);

    if (isNaN(minPrice) || isNaN(maxPrice) || minPrice > maxPrice) {
      Alert.alert("Error", "Invalid pricing.");
      return;
    }

    try {
      updateProduct(Number(id), {
        name: form.name,
        category: form.category,
        brand: form.brand,
        description: form.description,
        unit: form.unit,
        min_selling_price: minPrice,
        max_selling_price: maxPrice,
        min_stock_alert: parseInt(form.min_stock_alert) || 0,
      });
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to update product.");
      console.error(e);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Deactivate Product",
      "Are you sure you want to remove this product? It will be hidden from the list but historical sales will be preserved.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Deactivate", 
          style: "destructive",
          onPress: () => {
            try {
              deactivateProduct(Number(id));
              router.back();
            } catch (e) {
              Alert.alert("Error", "Failed to deactivate product.");
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <View className="bg-primary-50 p-4 rounded-xl mb-6">
        <Text className="text-gray-600 text-sm">Current Stock</Text>
        <Text className="text-3xl font-bold text-primary-700">{form.total_stock} {form.unit}</Text>
      </View>

      <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Product Name *</Text>
      <TextInput
        className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-900"
        value={form.name}
        onChangeText={(t) => setForm({ ...form, name: t })}
      />

      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Category</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-900"
            value={form.category}
            onChangeText={(t) => setForm({ ...form, category: t })}
          />
        </View>
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Brand</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-900"
            value={form.brand}
            onChangeText={(t) => setForm({ ...form, brand: t })}
          />
        </View>
      </View>

      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Min Sell Price *</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-900"
            value={form.min_selling_price}
            onChangeText={(t) => setForm({ ...form, min_selling_price: t })}
            keyboardType="numeric"
          />
        </View>
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Max Sell Price *</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-900"
            value={form.max_selling_price}
            onChangeText={(t) => setForm({ ...form, max_selling_price: t })}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Unit</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-900"
            value={form.unit}
            onChangeText={(t) => setForm({ ...form, unit: t })}
          />
        </View>
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Low Stock Alert</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-900"
            value={form.min_stock_alert}
            onChangeText={(t) => setForm({ ...form, min_stock_alert: t })}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Description</Text>
      <TextInput
        className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 text-base"
        value={form.description}
        onChangeText={(t) => setForm({ ...form, description: t })}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        className="bg-primary-600 p-4 rounded-xl items-center mb-4"
        onPress={handleSave}
      >
        <Text className="text-white font-bold text-lg">Update Product</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-red-50 p-4 rounded-xl items-center mb-10 border border-red-200"
        onPress={handleDelete}
      >
        <Text className="text-red-600 font-bold text-lg">Deactivate / Delete Product</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
