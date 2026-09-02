import { ORDER_STATUS_SEQUENCE, type OrderStatus } from "@/types";

const LABELS: Record<OrderStatus, string> = {
  pending: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderStatusTrack({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <span style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>
        Cancelled
      </span>
    );
  }

  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(status);

  return (
    <div
      role="img"
      aria-label={`Order status: ${LABELS[status]}`}
      style={{ display: "flex", alignItems: "center", gap: 4 }}
    >
      {ORDER_STATUS_SEQUENCE.map((step, i) => {
        const reached = i <= currentIndex;
        return (
          <div key={step} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              title={LABELS[step]}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: reached ? "var(--accent)" : "var(--border)",
                display: "inline-block",
              }}
            />
            {i < ORDER_STATUS_SEQUENCE.length - 1 && (
              <span
                style={{
                  width: 20,
                  height: 2,
                  background: i < currentIndex ? "var(--accent)" : "var(--border)",
                }}
              />
            )}
          </div>
        );
      })}
      <span style={{ marginLeft: 8, fontSize: 13, color: "var(--text-muted)" }}>
        {LABELS[status]}
      </span>
    </div>
  );
}
