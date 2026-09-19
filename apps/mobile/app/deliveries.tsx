import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api, ApiError } from "@/lib/api";
import { colors, spacing, radius } from "@/theme";
import type { Order } from "@/types";

export default function AvailableDeliveriesScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<Order[]>("/orders/available");
      setOrders(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load deliveries.");
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

  async function handleAccept(order: Order) {
    setAcceptingId(order.id);
    try {
      const accepted = await api.post<Order>(`/orders/${order.id}/accept`);
      router.replace(`/order/${accepted.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        Alert.alert("Already claimed", "Another rider already accepted this delivery.");
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
      } else {
        Alert.alert("Couldn't accept", err instanceof ApiError ? err.message : "Please try again.");
      }
    } finally {
      setAcceptingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Loading deliveries…</Text>
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
            <Text style={styles.muted}>No deliveries ready for pickup right now.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.address} numberOfLines={2}>
              {item.delivery_address}
            </Text>
            <Text style={styles.meta}>
              {item.items.length} item{item.items.length === 1 ? "" : "s"} · ${item.total_amount.toFixed(2)}
            </Text>
            <Pressable
              onPress={() => handleAccept(item)}
              disabled={acceptingId === item.id}
              accessibilityRole="button"
              accessibilityLabel={`Accept delivery to ${item.delivery_address}`}
              style={[styles.button, acceptingId === item.id && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>
                {acceptingId === item.id ? "Accepting…" : "Accept delivery"}
              </Text>
            </Pressable>
          </View>
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
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 2, marginBottom: spacing.sm },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#1A0D05", fontWeight: "700", fontSize: 14 },
});