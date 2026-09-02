import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@/theme";
import { registerForPushNotifications } from "@/lib/notifications";

export default function RootLayout() {
  useEffect(() => {
    // Silently no-ops on simulators / if the user declines — never blocks the UI.
    registerForPushNotifications().catch((err) =>
      console.warn("Push registration failed", err)
    );
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "DelivEasy" }} />
        <Stack.Screen name="order/[id]" options={{ title: "Order tracking" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
