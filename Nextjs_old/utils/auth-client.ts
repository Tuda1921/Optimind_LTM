import { LoginCredentials, SignupCredentials, AuthResponse, User } from "./types";

export async function clientLogin(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) return { user: null, error: data?.error || "Login failed" };
    return data;
  } catch (e: any) {
    return { user: null, error: e?.message || "Login failed" };
  }
}

export async function clientSignup(credentials: SignupCredentials): Promise<AuthResponse> {
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) return { user: null, error: data?.error || "Signup failed" };
    return data;
  } catch (e: any) {
    return { user: null, error: e?.message || "Signup failed" };
  }
}

export async function clientLogout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
}

export async function clientGetCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ?? null;
  } catch {
    return null;
  }
}
