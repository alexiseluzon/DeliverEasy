"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/products", label: "Catalog" },
  { href: "/orders", label: "Orders" },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <nav
      aria-label="Primary"
      style={{
        width: 220,
        borderRight: "1px solid var(--border)",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        className="font-display"
        style={{ fontSize: 18, fontWeight: 700, padding: "0 12px 20px" }}
      >
        DelivEasy
      </div>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            padding: "10px 12px",
            borderRadius: "var(--radius)",
            color: "var(--text)",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          {item.label}
        </Link>
      ))}

      <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        {user ? (
          <>
            <div style={{ padding: "0 12px 8px", fontSize: 13, color: "var(--text-muted)" }}>
              {user.full_name}
            </div>
            <button
              onClick={logout}
              title="Sign out of your account"
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: "var(--radius)",
                background: "transparent",
                border: "none",
                color: "var(--danger)",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            style={{
              display: "block",
              padding: "10px 12px",
              borderRadius: "var(--radius)",
              color: "var(--accent)",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}