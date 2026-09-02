import { StatCard } from "@/components/StatCard";

export const metadata = { title: "Overview — DelivEasy" };

export default function OverviewPage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Overview</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28 }}>
        Today&apos;s snapshot across your catalog and deliveries.
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard label="Active products" value="—" />
        <StatCard label="Orders today" value="—" accent="var(--accent)" />
        <StatCard label="Out for delivery" value="—" accent="var(--warning)" />
        <StatCard label="Delivered today" value="—" accent="var(--success)" />
      </div>

      <p style={{ marginTop: 32, fontSize: 13, color: "var(--text-muted)" }}>
        Connect the API (see <code>NEXT_PUBLIC_API_URL</code>) to populate live figures.
      </p>
    </div>
  );
}
