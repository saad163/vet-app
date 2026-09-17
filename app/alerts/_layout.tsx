import { Stack } from "expo-router";

export default function AlertsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Alerts" }} />
    </Stack>
  );
}
