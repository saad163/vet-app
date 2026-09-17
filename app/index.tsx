import { Text, View, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { Link, useFocusEffect } from "expo-router";
import { getDashboardMetrics, DashboardMetrics } from "../src/db/dashboard";
import { Package, ShoppingCart, Activity, AlertTriangle } from "lucide-react-native";

export default function Index() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    try {
      setMetrics(getDashboardMetrics());
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView 
      className="flex-1 bg-primary-50 p-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="mb-6 mt-4">
        <Text className="text-3xl font-bold text-primary-800">Veterinary Store</Text>
        <Text className="text-gray-600 mt-1">Overview</Text>
      </View>

      <View className="flex-row justify-between mb-4">
        <View className="bg-white w-[48%] p-4 rounded-2xl shadow-sm border border-gray-100">
          <Text className="text-gray-500 font-medium mb-1">Today's Sales</Text>
          <Text className="text-2xl font-bold text-gray-800">Rs. {metrics?.todaySales || 0}</Text>
        </View>
        <View className="bg-white w-[48%] p-4 rounded-2xl shadow-sm border border-gray-100">
          <Text className="text-gray-500 font-medium mb-1">Today's Profit</Text>
          <Text className="text-2xl font-bold text-green-600">Rs. {metrics?.todayProfit || 0}</Text>
        </View>
      </View>

      <View className="flex-row justify-between mb-6">
        <View className="bg-white w-[48%] p-4 rounded-2xl shadow-sm border border-gray-100">
          <Text className="text-gray-500 font-medium mb-1">Total Products</Text>
          <Text className="text-2xl font-bold text-gray-800">{metrics?.totalProducts || 0}</Text>
        </View>
        <View className="bg-white w-[48%] p-4 rounded-2xl shadow-sm border border-gray-100">
          <Text className="text-gray-500 font-medium mb-1">Total Stock</Text>
          <Text className="text-2xl font-bold text-gray-800">{metrics?.totalStock || 0}</Text>
        </View>
      </View>

      <Text className="text-lg font-bold text-gray-800 mb-3">Quick Actions</Text>
      <View className="flex-row flex-wrap justify-between mb-6">
        <Link href="/sales" asChild>
          <TouchableOpacity className="bg-white w-[48%] py-5 rounded-2xl shadow-sm mb-4 items-center border border-gray-100">
            <ShoppingCart size={28} color="#3b82f6" className="mb-2" />
            <Text className="text-base font-bold text-gray-700">Sales</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/products" asChild>
          <TouchableOpacity className="bg-white w-[48%] py-5 rounded-2xl shadow-sm mb-4 items-center border border-gray-100">
            <Package size={28} color="#3b82f6" className="mb-2" />
            <Text className="text-base font-bold text-gray-700">Products</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/purchases" asChild>
          <TouchableOpacity className="bg-white w-[48%] py-5 rounded-2xl shadow-sm mb-4 items-center border border-gray-100">
            <Activity size={28} color="#3b82f6" className="mb-2" />
            <Text className="text-base font-bold text-gray-700">Purchases</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/alerts" asChild>
          <TouchableOpacity className="bg-white w-[48%] py-5 rounded-2xl shadow-sm mb-4 items-center border border-gray-100 relative">
            {((metrics?.lowStockCount || 0) + (metrics?.outOfStockCount || 0) + (metrics?.expiringSoonCount || 0)) > 0 && (
              <View className="absolute top-2 right-4 bg-red-500 w-3 h-3 rounded-full" />
            )}
            <AlertTriangle size={28} color="#f59e0b" className="mb-2" />
            <Text className="text-base font-bold text-gray-700">Alerts</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/customers" asChild>
          <TouchableOpacity className="bg-white w-[48%] py-5 rounded-2xl shadow-sm mb-4 items-center border border-gray-100">
            <Text className="text-base font-bold text-gray-700">Customers</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/settings" asChild>
          <TouchableOpacity className="bg-white w-[48%] py-5 rounded-2xl shadow-sm mb-4 items-center border border-gray-100">
            <Text className="text-base font-bold text-gray-700">Settings & Reports</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {((metrics?.lowStockCount || 0) > 0 || (metrics?.outOfStockCount || 0) > 0 || (metrics?.expiringSoonCount || 0) > 0) && (
        <View className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-10">
          <Text className="font-bold text-orange-800 mb-2">Attention Needed</Text>
          {(metrics?.outOfStockCount || 0) > 0 && (
            <Text className="text-orange-700">• {metrics?.outOfStockCount} products out of stock</Text>
          )}
          {(metrics?.lowStockCount || 0) > 0 && (
            <Text className="text-orange-700">• {metrics?.lowStockCount} products low on stock</Text>
          )}
          {(metrics?.expiringSoonCount || 0) > 0 && (
            <Text className="text-orange-700">• {metrics?.expiringSoonCount} batches expiring soon</Text>
          )}
        </View>
      )}

      <StatusBar style="auto" />
    </ScrollView>
  );
}
