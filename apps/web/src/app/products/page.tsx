"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Product } from "@/types";

export default function ProductsPage() {
  const { show } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const canSubmit = name.trim().length > 0 && Number(price) > 0 && Number(stock) >= 0;

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await api.get<Product[]>("/products");
      setProducts(data);
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Couldn't load products.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // vendor_id is a placeholder until auth wiring lands
      await api.post("/products?vendor_id=00000000-0000-0000-0000-000000000000", {
        name,
        price: Number(price),
        stock_quantity: Number(stock),
      });
      show("Product added.");
      setName("");
      setPrice("");
      setStock("");
      loadProducts();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Couldn't add product.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await api.del(`/products/${pendingDelete.id}`);
      show("Product removed.");
      setProducts((p) => p.filter((item) => item.id !== pendingDelete.id));
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Couldn't remove product.", "error");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Catalog</h1>

      <form
        onSubmit={handleCreate}
        style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-end" }}
      >
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Price">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Stock">
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          title="Add product to catalog"
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            background: canSubmit ? "var(--accent)" : "var(--border)",
            color: canSubmit ? "#1a0d05" : "var(--text-muted)",
            fontWeight: 600,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {submitting ? "Adding…" : "Add product"}
        </button>
      </form>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : products.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No products yet. Add your first one above.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "8px 4px" }}>Name</th>
              <th style={{ padding: "8px 4px" }}>Price</th>
              <th style={{ padding: "8px 4px" }}>Stock</th>
              <th style={{ padding: "8px 4px" }} aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 4px" }}>{p.name}</td>
                <td style={{ padding: "10px 4px" }}>${p.price.toFixed(2)}</td>
                <td style={{ padding: "10px 4px" }}>{p.stock_quantity}</td>
                <td style={{ padding: "10px 4px", textAlign: "right" }}>
                  <button
                    onClick={() => setPendingDelete(p)}
                    title="Remove product"
                    aria-label={`Remove ${p.name}`}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      color: "var(--danger)",
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remove this product?"
        description={`"${pendingDelete?.name}" will be hidden from the catalog. This can't be undone from here.`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
      {label}
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "8px 10px",
  color: "var(--text)",
  fontSize: 14,
  width: 140,
};
