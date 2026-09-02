import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/theme";
import type { Product } from "@/types";

export function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  const outOfStock = product.stock_quantity <= 0;

  return (
    <View style={styles.card}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        {outOfStock && <Text style={styles.outOfStock}>Out of stock</Text>}
      </View>

      <Pressable
        onPress={() => onAdd(product)}
        disabled={outOfStock}
        accessibilityRole="button"
        accessibilityLabel={`Add ${product.name} to cart`}
        style={({ pressed }) => [
          styles.addButton,
          { opacity: outOfStock ? 0.4 : pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={styles.addButtonText}>{outOfStock ? "Unavailable" : "Add"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  image: { width: 56, height: 56, borderRadius: radius.sm },
  imagePlaceholder: { backgroundColor: colors.surfaceRaised },
  info: { flex: 1, marginLeft: spacing.sm },
  name: { color: colors.text, fontSize: 15, fontWeight: "600" },
  price: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  outOfStock: { color: colors.danger, fontSize: 12, marginTop: 2 },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addButtonText: { color: "#1A0D05", fontWeight: "700", fontSize: 13 },
});
