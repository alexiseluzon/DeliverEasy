import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/products", label: "Catalog" },
  { href: "/orders", label: "Orders" },
];

export function Sidebar() {
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
    </nav>
  );
}
