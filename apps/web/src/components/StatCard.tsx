export function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "18px 20px",
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>{label}</div>
      <div className="font-display" style={{ fontSize: 28, fontWeight: 700, color: accent ?? "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}
