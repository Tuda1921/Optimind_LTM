import { NextResponse } from "next/server";

// Mock user store (replace with your real DB later)
const DEMO_USER = {
  id: "u_1",
  name: "Demo User",
  email: "demo@example.com",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Demo: chấp nhận bất kỳ email/password nào để test
    const user = {
      id: "u_" + Math.random().toString(36).slice(2, 9),
      email: email,
      username: email.split("@")[0],
    };

    const token = Math.random().toString(36).slice(2);

    const res = NextResponse.json({ user, token });
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    res.cookies.set("user_data", JSON.stringify(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (e) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
