import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function getUserIdFromCookie(req: Request): string | null {
  const cookie = req.headers.get("cookie") || "";
  const userCookie = cookie.split(";").find((c) => c.trim().startsWith("user_data="));
  if (!userCookie) return null;
  try {
    const value = decodeURIComponent(userCookie.split("=")[1]);
    const user = JSON.parse(value);
    return user.id;
  } catch {
    return null;
  }
}

// GET /api/gamification/pet - Get user's pet
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromCookie(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let pet = await prisma.pet.findUnique({
      where: { userId },
    });

    // Create default pet if doesn't exist
    if (!pet) {
      pet = await prisma.pet.create({
        data: {
          userId,
          name: "My Pet",
          type: "cat",
        },
      });
    }

    return NextResponse.json({ pet });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch pet" }, { status: 500 });
  }
}
