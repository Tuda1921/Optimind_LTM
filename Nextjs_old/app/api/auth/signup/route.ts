import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, username } = body || {};

    if (!email || !password || !username) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Demo: echo back created user (replace with DB persistence)
    const user = { id: "u_new", email, username };
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
