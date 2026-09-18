import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ProductCard } from "@/components/ProductCard";
import { api, ApiError } from "@/lib/api";
import { colors, spacing } from "@/theme";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";

export default function HomeScreen() {
  const router = useRouter();
  const { addItem, lines } = useCart();
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
    addItem(product);
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

  const cartCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.push("/orders")}
          accessibilityRole="button"
          accessibilityLabel="View my orders"
        >
          <Text style={styles.link}>My orders</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/checkout")}
          disabled={cartCount === 0}
          accessibilityRole="button"
          accessibilityLabel={`Go to checkout, ${cartCount} items in cart`}
        >
          <Text style={[styles.link, cartCount === 0 && styles.linkDisabled]}>
            Cart ({cartCount})
          </Text>
        </Pressable>
      </View>

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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  link: { color: colors.accent, fontSize: 14, fontWeight: "600" },
  linkDisabled: { color: colors.textMuted },
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