import { Stack } from "expo-router";

export default function PurchasesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Purchases" }} />
      <Stack.Screen name="new" options={{ title: "New Purchase" }} />
    </Stack>
  );
}
