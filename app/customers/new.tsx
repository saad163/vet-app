import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { addCustomer } from "../../src/db/customers";

export default function NewCustomer() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const handleSave = () => {
    if (!form.name) {
      Alert.alert("Error", "Customer name is required.");
      return;
    }

    try {
      addCustomer(form.name, form.phone, form.address, form.notes);
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save customer.");
      console.error(e);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Name *</Text>
      <TextInput
        className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-900"
        value={form.name}
        onChangeText={(t) => setForm({ ...form, name: t })}
      />

      <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Phone</Text>
      <TextInput
        className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-900"
        value={form.phone}
        onChangeText={(t) => setForm({ ...form, phone: t })}
        keyboardType="phone-pad"
      />

      <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Address</Text>
      <TextInput
        className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-base text-gray-900"
        value={form.address}
        onChangeText={(t) => setForm({ ...form, address: t })}
      />

      <Text className="text-sm text-gray-500 font-bold mb-1 uppercase">Notes</Text>
      <TextInput
        className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 text-base"
        value={form.notes}
        onChangeText={(t) => setForm({ ...form, notes: t })}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        className="bg-primary-600 p-4 rounded-xl items-center mb-10"
        onPress={handleSave}
      >
        <Text className="text-white font-bold text-lg">Save Customer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
