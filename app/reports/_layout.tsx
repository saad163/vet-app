import { Stack } from "expo-router";

export default function ReportsLayout() {
  return (
    <Stack>
      <Stack.Screen name="daily" options={{ title: "Sales Reports" }} />
      <Stack.Screen name="products" options={{ title: "Product Performance" }} />
    </Stack>
  );
}
