import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { OrderStatusTrack } from "@/components/OrderStatusTrack";
import { api, ApiError } from "@/lib/api";
import { colors, spacing } from "@/theme";
import type { Order } from "@/types";

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<Order>(`/orders/${id}`)
      .then(setOrder)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this order."));
  }, [id]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Loading order…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.address}>{order.delivery_address}</Text>
      <Text style={styles.total}>${order.total_amount.toFixed(2)}</Text>
      <View style={{ marginTop: spacing.lg }}>
        <OrderStatusTrack status={order.status} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  muted: { color: colors.textMuted },
  error: { color: colors.danger },
  address: { color: colors.text, fontSize: 16, fontWeight: "600" },
  total: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
});
