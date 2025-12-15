import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, username } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        name: name || username || email.split("@")[0],
        username: username || name || email.split("@")[0],
        passwordHash: hashedPassword,
        level: 1,
        experience: 0,
        exp: 0,
        coins: 0,
      },
    });

    // Create default pet for user
    await prisma.pet.create({
      data: {
        userId: user.id,
        name: "My Pet",
        type: "cat",
        hunger: 50,
        happiness: 50,
        energy: 50,
      },
    });

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      avatarUrl: user.avatarUrl,
      level: user.level,
      exp: user.exp,
      experience: user.experience,
      coins: user.coins,
    };

    return NextResponse.json({ user: userData });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
