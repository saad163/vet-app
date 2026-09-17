import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { addProduct } from "../../src/db/products";

export default function NewProduct() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    category: "",
    brand: "",
    description: "",
    unit: "pcs",
    min_selling_price: "",
    max_selling_price: "",
    min_stock_alert: "5",
  });

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
      addProduct({
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
      Alert.alert("Error", "Failed to save product.");
      console.error(e);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Product Name *</Text>
      <TextInput
        className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base"
        value={form.name}
        onChangeText={(t) => setForm({ ...form, name: t })}
        placeholder="E.g. Paracetamol"
      />

      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Category</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base"
            value={form.category}
            onChangeText={(t) => setForm({ ...form, category: t })}
            placeholder="Medicine"
          />
        </View>
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Brand</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base"
            value={form.brand}
            onChangeText={(t) => setForm({ ...form, brand: t })}
            placeholder="ABC Vet"
          />
        </View>
      </View>

      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Min Sell Price *</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base"
            value={form.min_selling_price}
            onChangeText={(t) => setForm({ ...form, min_selling_price: t })}
            keyboardType="numeric"
            placeholder="Rs."
          />
        </View>
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Max Sell Price *</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base"
            value={form.max_selling_price}
            onChangeText={(t) => setForm({ ...form, max_selling_price: t })}
            keyboardType="numeric"
            placeholder="Rs."
          />
        </View>
      </View>

      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Unit</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base"
            value={form.unit}
            onChangeText={(t) => setForm({ ...form, unit: t })}
            placeholder="bottle, pcs, ml"
          />
        </View>
        <View className="w-[48%]">
          <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Low Stock Alert At</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base"
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
        className="bg-primary-600 p-4 rounded-xl items-center mb-10"
        onPress={handleSave}
      >
        <Text className="text-white font-bold text-lg">Save Product</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
