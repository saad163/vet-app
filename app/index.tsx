import { Text, View, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { getDashboardMetrics, DashboardMetrics, getAlerts, AlertItem } from "../src/db/dashboard";
import { Package, ShoppingCart, Activity, AlertTriangle, AlertCircle, Clock, Edit2, ChevronRight, CheckCircle2 } from "lucide-react-native";

export default function Index() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = () => {
    try {
      setMetrics(getDashboardMetrics());
      setAlerts(getAlerts());
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
        <Text className="text-3xl font-bold text-teal-800">Veterinary Store</Text>
        <Text className="text-gray-600 mt-1">Overview</Text>
      </View>

      {/* ALERTS SECTION */}
      {alerts.length > 0 && (
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-800">Action Required</Text>
            {alerts.length > 5 && (
              <TouchableOpacity onPress={() => router.push('/alerts')}>
                <Text className="text-teal-600 font-bold">View All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <View className="bg-teal-50 px-4 py-3 border-b border-teal-100 flex-row justify-between">
              <Text className="text-teal-800 font-medium">
                {metrics?.outOfStockCount || 0} Out of Stock • {metrics?.lowStockCount || 0} Low Stock
              </Text>
              <Text className="text-teal-800 font-medium">
                {metrics?.nearExpiryCount || 0} Near Expiry • {metrics?.expiredCount || 0} Expired
              </Text>
            </View>
            
            <View className="p-2">
              {alerts.slice(0, 5).map((item) => {
                let icon, bgColor, textColor;
                if (item.type === 'EXPIRED') {
                  icon = <AlertCircle size={20} color="#dc2626" />;
                  bgColor = "bg-red-50";
                  textColor = "text-red-700";
                } else if (item.type === 'OUT_OF_STOCK') {
                  icon = <AlertCircle size={20} color="#dc2626" />;
                  bgColor = "bg-red-50";
                  textColor = "text-red-700";
                } else if (item.type === 'NEAR_EXPIRY') {
                  icon = <Clock size={20} color="#ea580c" />;
                  bgColor = "bg-orange-50";
                  textColor = "text-orange-700";
                } else {
                  // LOW_STOCK
                  icon = <AlertTriangle size={20} color="#ea580c" />;
                  bgColor = "bg-orange-50";
                  textColor = "text-orange-700";
                }

                return (
                  <TouchableOpacity 
                    key={item.id}
                    className={`flex-row items-center p-3 rounded-xl mb-2 ${bgColor}`}
                    onPress={() => router.push(`/alerts/${item.id}`)}
                  >
                    <View className="mr-3">{icon}</View>
                    <View className="flex-1">
                      <Text className={`font-bold ${textColor}`}>{item.productName}</Text>
                      <Text className={`${textColor} opacity-80 text-sm`}>{item.message}</Text>
                    </View>
                    <View className="bg-white p-2 rounded-lg opacity-80">
                      <Edit2 size={16} color={item.type === 'EXPIRED' || item.type === 'OUT_OF_STOCK' ? '#dc2626' : '#ea580c'} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

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
            {((metrics?.lowStockCount || 0) + (metrics?.outOfStockCount || 0) + (metrics?.nearExpiryCount || 0) + (metrics?.expiredCount || 0)) > 0 && (
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
        <Link href="/returns" asChild>
          <TouchableOpacity className="bg-white w-[48%] py-5 rounded-2xl shadow-sm mb-4 items-center border border-gray-100">
            <Text className="text-base font-bold text-gray-700">Return History</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/settings" asChild>
          <TouchableOpacity className="bg-white w-[48%] py-5 rounded-2xl shadow-sm mb-4 items-center border border-gray-100">
            <Text className="text-base font-bold text-gray-700">Settings & Reports</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View className="h-10" />

      <StatusBar style="auto" />
    </ScrollView>
  );
}
