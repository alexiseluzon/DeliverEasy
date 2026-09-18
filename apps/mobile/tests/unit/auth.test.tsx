import { getToken, getStoredUser, setSession, clearSession } from "@/lib/auth";
import type { User } from "@/types";

const user: User = {
  id: "1",
  email: "a@b.com",
  full_name: "A B",
  phone: null,
  role: "customer",
};

describe("mobile auth session storage", () => {
  afterEach(async () => {
    await clearSession();
  });

  it("returns null when nothing stored", async () => {
    expect(await getToken()).toBeNull();
    expect(await getStoredUser()).toBeNull();
  });

  it("stores and retrieves token and user", async () => {
    await setSession("tok123", user);
    expect(await getToken()).toBe("tok123");
    expect(await getStoredUser()).toEqual(user);
  });

  it("clears session", async () => {
    await setSession("tok123", user);
    await clearSession();
    expect(await getToken()).toBeNull();
    expect(await getStoredUser()).toBeNull();
  });
});