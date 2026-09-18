import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { colors, spacing, radius } from "@/theme";
import type { AuthResponse, UserRole } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES: { value: UserRole; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "rider", label: "Rider" },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("customer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email);
  const canSubmit = fullName.trim().length > 0 && emailValid && password.length >= 8;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<AuthResponse>("/auth/register", {
        full_name: fullName,
        email,
        password,
        role,
      });
      await login(res);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create account</Text>

        {error && (
          <View style={styles.errorBanner} accessibilityLiveRegion="polite">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Juan Dela Cruz"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Full name"
        />

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

        <Text style={styles.label}>Password (min 8 characters)</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Password"
        />

        <Text style={styles.label}>I am a</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => setRole(r.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: role === r.value }}
              accessibilityLabel={r.label}
              style={[styles.roleChip, role === r.value && styles.roleChipActive]}
            >
              <Text style={[styles.roleChipText, role === r.value && styles.roleChipTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          accessibilityRole="button"
          accessibilityLabel="Create account"
          style={[styles.button, (!canSubmit || submitting) && styles.buttonDisabled]}
        >
          <Text style={[styles.buttonText, (!canSubmit || submitting) && styles.buttonTextDisabled]}>
            {submitting ? "Creating…" : "Create account"}
          </Text>
        </Pressable>

        <Link href="/login" style={styles.link}>
          Already have an account? Sign in
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, justifyContent: "center", flexGrow: 1 },
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
  roleRow: { flexDirection: "row", gap: spacing.sm },
  roleChip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  roleChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  roleChipText: { color: colors.textMuted, fontSize: 13 },
  roleChipTextActive: { color: "#1A0D05", fontWeight: "700" },
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