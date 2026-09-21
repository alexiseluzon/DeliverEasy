import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text } from "react-native";
import { colors } from "@/theme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { addNotificationTapListener } from "@/lib/notifications";
import { LogoutHeaderButton } from "@/components/LogoutHeaderButton";

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
  const router = useRouter();

  useEffect(() => {
    // Handles the user tapping a push notification — routes to the
    // relevant order, or the rider delivery queue for the broadcast
    // "new delivery available" notification. No-ops in Expo Go.
    return addNotificationTapListener((data) => {
      const orderId = data?.order_id as string | undefined;
      const screen = data?.screen as string | undefined;
      if (orderId) {
        router.push(`/order/${orderId}`);
      } else if (screen === "deliveries") {
        router.push("/deliveries");
      }
    });
  }, [router]);

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
              <Stack.Screen
                name="index"
                options={{ title: "DelivEasy", headerRight: () => <LogoutHeaderButton /> }}
              />
              <Stack.Screen name="order/[id]" options={{ title: "Order tracking" }} />
              <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
              <Stack.Screen name="orders" options={{ title: "My orders" }} />
              <Stack.Screen
                name="deliveries"
                options={{ title: "Available deliveries", headerRight: () => <LogoutHeaderButton /> }}
              />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
            </Stack>
          </AuthGate>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}