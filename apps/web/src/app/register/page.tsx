"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import type { AuthResponse } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { show } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"vendor" | "customer" | "rider">("vendor");
  const [submitting, setSubmitting] = useState(false);

  const emailValid = EMAIL_RE.test(email);
  const canSubmit = fullName.trim().length > 0 && emailValid && password.length >= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await api.post<AuthResponse>("/auth/register", {
        full_name: fullName,
        email,
        password,
        role,
      });
      login(res);
      show("Account created.");
      router.push("/");
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Couldn't create account.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "60px auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Create account</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Full name">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} required />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            aria-invalid={email.length > 0 && !emailValid}
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Password (min 8 characters)">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        <Field label="Role">
          <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} style={inputStyle}>
            <option value="vendor">Vendor</option>
            <option value="customer">Customer</option>
            <option value="rider">Rider</option>
          </select>
        </Field>
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          title="Create your account"
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
          {submitting ? "Creating…" : "Create account"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
        Already have an account? <Link href="/login" style={{ color: "var(--accent)" }}>Sign in</Link>
      </p>
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
  padding: "10px 12px",
  color: "var(--text)",
  fontSize: 14,
};