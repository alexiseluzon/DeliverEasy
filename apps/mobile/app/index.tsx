import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ProductCard } from "@/components/ProductCard";
import { api, ApiError } from "@/lib/api";
import { colors, spacing } from "@/theme";
import type { Product } from "@/types";

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<Product[]>("/products");
      setProducts(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load the catalog.");
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

  function handleAdd(product: Product) {
    setConfirmation(`${product.name} added to cart`);
    setTimeout(() => setConfirmation(null), 2500);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Loading catalog…</Text>
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
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => <ProductCard product={item} onAdd={handleAdd} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.muted}>No products available right now.</Text>
          </View>
        }
      />

      {confirmation && (
        <View style={styles.toast} accessibilityLiveRegion="polite">
          <Text style={styles.toastText}>{confirmation}</Text>
        </View>
      )}
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
  toast: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.sm,
    alignItems: "center",
  },
  toastText: { color: colors.text, fontSize: 14 },
});
