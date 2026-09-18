import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { OrderStatusTrack } from "@/components/OrderStatusTrack";
import { api, ApiError } from "@/lib/api";
import { colors, spacing, radius } from "@/theme";
import type { Order } from "@/types";

export default function MyOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<Order[]>("/orders");
      setOrders(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load your orders.");
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Loading orders…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.muted}>No orders yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/order/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Order to ${item.delivery_address}`}
            style={styles.card}
          >
            <Text style={styles.address} numberOfLines={1}>
              {item.delivery_address}
            </Text>
            <Text style={styles.total}>${item.total_amount.toFixed(2)}</Text>
            <View style={{ marginTop: spacing.sm }}>
              <OrderStatusTrack status={item.status} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  muted: { color: colors.textMuted, fontSize: 14 },
  errorBanner: {
    backgroundColor: colors.danger + "22",
    borderColor: colors.danger,
    borderWidth: 1,
    margin: spacing.md,
    borderRadius: 8,
    padding: spacing.sm,
  },
  errorText: { color: colors.danger, fontSize: 13 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  address: { color: colors.text, fontSize: 15, fontWeight: "600" },
  total: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
});