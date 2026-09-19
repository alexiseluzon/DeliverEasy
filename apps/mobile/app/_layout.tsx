import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text } from "react-native";
import { colors } from "@/theme";
import { registerForPushNotifications } from "@/lib/notifications";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "login" || segments[0] === "register";
    if (!user && !inAuthGroup) {
      router.replace("/login");
      return;
    }
    if (user && inAuthGroup) {
      router.replace(user.role === "rider" ? "/deliveries" : "/");
      return;
    }
    // Riders land on their delivery queue, not the customer catalog.
    if (user && user.role === "rider" && segments[0] === undefined) {
      router.replace("/deliveries");
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.textMuted }}>Loading…</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    // Silently no-ops on simulators / if the user declines — never blocks the UI.
    registerForPushNotifications().catch((err) =>
      console.warn("Push registration failed", err)
    );
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="light" />
          <AuthGate>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="index" options={{ title: "DelivEasy" }} />
              <Stack.Screen name="order/[id]" options={{ title: "Order tracking" }} />
              <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
              <Stack.Screen name="orders" options={{ title: "My orders" }} />
              <Stack.Screen name="deliveries" options={{ title: "Available deliveries" }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
            </Stack>
          </AuthGate>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}