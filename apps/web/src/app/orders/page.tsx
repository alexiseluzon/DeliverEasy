"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RequireAuth } from "@/components/RequireAuth";
import { OrderStatusTrack } from "@/components/OrderStatusTrack";
import { NEXT_ORDER_STATUS, ORDER_STATUS_LABELS, formatMoney, type Order } from "@/types";

export default function OrdersPage() {
  return (
    <RequireAuth roles={["vendor", "admin", "rider"]}>
      <OrdersContent />
    </RequireAuth>
  );
}

function OrdersContent() {
  const { show } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAdvance, setPendingAdvance] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Order[]>("/orders");
      setOrders(data);
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Couldn't load orders.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function advanceStatus(order: Order) {
    const next = NEXT_ORDER_STATUS[order.status];
    if (!next) return;
    setUpdatingId(order.id);
    try {
      const updated = await api.patch<Order>(`/orders/${order.id}/status`, { status: next });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      show(`Order moved to ${ORDER_STATUS_LABELS[next]}.`);
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Couldn't update order.", "error");
    } finally {
      setUpdatingId(null);
      setPendingAdvance(null);
    }
  }

  if (loading) return <p style={{ color: "var(--text-muted)" }}>Loading orders…</p>;

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Orders</h1>

      {orders.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No orders yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((order) => {
            const next = NEXT_ORDER_STATUS[order.status];
            return (
              <div
                key={order.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 16,
                  background: "var(--surface)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{order.delivery_address}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                      {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                      {formatMoney(order.total_amount)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{formatMoney(order.total_amount)}</div>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <OrderStatusTrack status={order.status} />
                  {next && (
                    <button
                      onClick={() => setPendingAdvance(order)}
                      disabled={updatingId === order.id}
                      title={`Move order to ${ORDER_STATUS_LABELS[next]}`}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: "var(--accent)",
                        color: "#1a0d05",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: updatingId === order.id ? "not-allowed" : "pointer",
                        opacity: updatingId === order.id ? 0.6 : 1,
                      }}
                    >
                      Mark {ORDER_STATUS_LABELS[next]}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pendingAdvance !== null}
        title="Update order status"
        description={
          pendingAdvance
            ? `Move this order to "${ORDER_STATUS_LABELS[NEXT_ORDER_STATUS[pendingAdvance.status]!]}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Confirm"
        onConfirm={() => pendingAdvance && advanceStatus(pendingAdvance)}
        onCancel={() => setPendingAdvance(null)}
      />
    </div>
  );
}