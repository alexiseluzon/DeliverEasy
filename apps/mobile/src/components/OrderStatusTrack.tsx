import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/theme";
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE, type OrderStatus } from "@/types";

export function OrderStatusTrack({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <Text
        accessibilityRole="text"
        style={{ color: colors.danger, fontWeight: "600", fontSize: 14 }}
      >
        Cancelled
      </Text>
    );
  }

  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(status);

  return (
    <View
      accessible
      accessibilityLabel={`Order status: ${ORDER_STATUS_LABELS[status]}`}
      style={styles.row}
    >
      {ORDER_STATUS_SEQUENCE.map((step, i) => {
        const reached = i <= currentIndex;
        return (
          <View key={step} style={styles.stepGroup}>
            <View style={[styles.dot, { backgroundColor: reached ? colors.accent : colors.border }]} />
            {i < ORDER_STATUS_SEQUENCE.length - 1 && (
              <View
                style={[styles.line, { backgroundColor: i < currentIndex ? colors.accent : colors.border }]}
              />
            )}
          </View>
        );
      })}
      <Text style={styles.label}>{ORDER_STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  stepGroup: { flexDirection: "row", alignItems: "center" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { width: 18, height: 2, marginHorizontal: 2 },
  label: { marginLeft: spacing.sm, color: colors.textMuted, fontSize: 13 },
});
