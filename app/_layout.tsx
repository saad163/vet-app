import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { initDatabase } from "../database";
import "../global.css";

export default function Layout() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const setupDatabase = () => {
    setDbError(null);
    try {
      initDatabase();
      setDbInitialized(true);
    } catch (e: any) {
      console.error("Failed to initialize database:", e);
      // Always show the app — do not go blank.
      // The error banner lets the user retry or at least see what happened.
      setDbError(e?.message || "Database failed to initialize. Please restart the app.");
      // Still allow the app to render — the DB might be partially working.
      setDbInitialized(true);
    }
  };

  useEffect(() => {
    setupDatabase();
  }, []);

  if (!dbInitialized) {
    return null; // Very brief — only before first init attempt completes
  }

  return (
    <>
      {dbError && (
        <View style={{ backgroundColor: '#fef2f2', padding: 12, borderBottomWidth: 1, borderBottomColor: '#fecaca' }}>
          <Text style={{ color: '#dc2626', fontWeight: 'bold', fontSize: 13 }}>
            ⚠️ DB Warning: {dbError}
          </Text>
          <TouchableOpacity onPress={setupDatabase} style={{ marginTop: 4 }}>
            <Text style={{ color: '#dc2626', fontSize: 12, textDecorationLine: 'underline' }}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}
      <Stack>
        <Stack.Screen name="index" options={{ title: "Dashboard" }} />
        <Stack.Screen name="products" options={{ headerShown: false }} />
        <Stack.Screen name="sales" options={{ headerShown: false }} />
        <Stack.Screen name="purchases" options={{ headerShown: false }} />
        <Stack.Screen name="reports" options={{ headerShown: false }} />
        <Stack.Screen name="customers" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="returns" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
