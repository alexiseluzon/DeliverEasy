import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { colors, spacing, radius } from "@/theme";
import type { AuthResponse } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email);
  const canSubmit = emailValid && password.length >= 8;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<AuthResponse>("/auth/login", { email, password });
      await login(res);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Sign in</Text>

      {error && (
        <View style={styles.errorBanner} accessibilityLiveRegion="polite">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="you@example.com"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Email"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        placeholder="••••••••"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Password"
      />

      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit || submitting}
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        style={[styles.button, (!canSubmit || submitting) && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, (!canSubmit || submitting) && styles.buttonTextDisabled]}>
          {submitting ? "Signing in…" : "Sign in"}
        </Text>
      </Pressable>

      <Link href="/register" style={styles.link}>
        No account? Register
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, justifyContent: "center" },
  title: { color: colors.text, fontSize: 24, fontWeight: "700", marginBottom: spacing.lg },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonDisabled: { backgroundColor: colors.border },
  buttonText: { color: "#1A0D05", fontWeight: "700", fontSize: 15 },
  buttonTextDisabled: { color: colors.textMuted },
  link: { color: colors.accent, marginTop: spacing.lg, textAlign: "center", fontSize: 13 },
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