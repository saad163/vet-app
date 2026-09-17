import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { initDatabase } from "../database";
import "../global.css";

export default function Layout() {
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    try {
      initDatabase();
      setDbInitialized(true);
    } catch (e) {
      console.error("Failed to initialize database:", e);
    }
  }, []);

  if (!dbInitialized) {
    return null; // Or a loading screen
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Dashboard" }} />
    </Stack>
  );
}
