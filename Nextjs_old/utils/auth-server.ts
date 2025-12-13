import { cookies } from "next/headers";
import { User, AuthResponse, LoginCredentials, SignupCredentials } from "./types";

const TOKEN_COOKIE_NAME = "auth_token";
const USER_COOKIE_NAME = "user_data";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/auth/login`, {
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

export async function signup(credentials: SignupCredentials): Promise<AuthResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
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

export async function logout(): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    await fetch(`${baseUrl}/api/auth/logout`, { method: "POST" });
  } catch {}
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE_NAME)?.value || null;
}
