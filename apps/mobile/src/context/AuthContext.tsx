import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getStoredUser, getToken, clearSession, setSession } from "@/lib/auth";
import { setAuthToken, setUnauthorizedHandler, api } from "@/lib/api";
import { registerForPushNotifications } from "@/lib/notifications";
import type { AuthResponse, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (res: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [token, storedUser] = await Promise.all([getToken(), getStoredUser()]);
      setAuthToken(token);
      setUser(token ? storedUser : null);
      setLoading(false);
    })();

    setUnauthorizedHandler(() => {
      clearSession();
      setAuthToken(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Registers the device's push token with the backend once a user is
  // signed in — the endpoint requires auth, so this can't happen at
  // app boot before login. Silently no-ops if the user declined
  // notification permissions or is running on a simulator.
  useEffect(() => {
    if (!user) return;
    registerForPushNotifications()
      .then((token) => {
        if (token) return api.put("/auth/push-token", { push_token: token });
      })
      .catch((err) => console.warn("Push token registration failed", err));
  }, [user?.id]);

  async function login(res: AuthResponse) {
    await setSession(res.access_token, res.user);
    setAuthToken(res.access_token);
    setUser(res.user);
  }

  async function logout() {
    await clearSession();
    setAuthToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}