import { getToken, getStoredUser, setSession, clearSession } from "@/lib/auth";
import type { User } from "@/types";

const user: User = {
  id: "1",
  email: "a@b.com",
  full_name: "A B",
  phone: null,
  role: "vendor",
};

describe("auth session storage", () => {
  afterEach(() => clearSession());

  it("returns null when nothing stored", () => {
    expect(getToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it("stores and retrieves token and user", () => {
    setSession("tok123", user);
    expect(getToken()).toBe("tok123");
    expect(getStoredUser()).toEqual(user);
  });

  it("clears session", () => {
    setSession("tok123", user);
    clearSession();
    expect(getToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });
});