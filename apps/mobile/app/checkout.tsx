import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "@/context/CartContext";
import { api, ApiError } from "@/lib/api";
import { colors, spacing, radius } from "@/theme";
import type { Order, OrderCreate } from "@/types";

export default function CheckoutScreen() {
  const router = useRouter();
  const { lines, removeItem, clear, total } = useCart();
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = address.trim().length > 0 && lines.length > 0;

  async function handlePlaceOrder() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: OrderCreate = {
        delivery_address: address.trim(),
        items: lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity })),
      };
      const order = await api.post<Order>("/orders", payload);
      clear();
      router.replace(`/order/${order.id}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't place order.";
      setError(message);
      Alert.alert("Order failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={lines}
        keyExtractor={(l) => l.product.id}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={<Text style={styles.muted}>Your cart is empty.</Text>}
        renderItem={({ item }) => (
          <View style={styles.line}>
            <Text style={styles.lineName}>
              {item.quantity}× {item.product.name}
            </Text>
            <View style={styles.lineRight}>
              <Text style={styles.lineTotal}>${(Number(item.product.price) * item.quantity).toFixed(2)}</Text>
              <Pressable
                onPress={() => removeItem(item.product.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.product.name} from cart`}
              >
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        {error && (
          <View style={styles.errorBanner} accessibilityLiveRegion="polite">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>Delivery address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Street, barangay, city"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Delivery address"
        />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>

        <Pressable
          onPress={handlePlaceOrder}
          disabled={!canSubmit || submitting}
          accessibilityRole="button"
          accessibilityLabel="Place order"
          style={[styles.button, (!canSubmit || submitting) && styles.buttonDisabled]}
        >
          <Text style={[styles.buttonText, (!canSubmit || submitting) && styles.buttonTextDisabled]}>
            {submitting ? "Placing order…" : "Place order"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  muted: { color: colors.textMuted, padding: spacing.md },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineName: { color: colors.text, fontSize: 14, flex: 1 },
  lineRight: { alignItems: "flex-end", gap: 2 },
  lineTotal: { color: colors.text, fontSize: 14, fontWeight: "600" },
  remove: { color: colors.danger, fontSize: 12 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
  },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  totalLabel: { color: colors.textMuted, fontSize: 14 },
  totalValue: { color: colors.text, fontSize: 16, fontWeight: "700" },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonDisabled: { backgroundColor: colors.border },
  buttonText: { color: "#1A0D05", fontWeight: "700", fontSize: 15 },
  buttonTextDisabled: { color: colors.textMuted },
  errorBanner: {
    backgroundColor: colors.danger + "22",
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 13 },
});