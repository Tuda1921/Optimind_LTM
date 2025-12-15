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

// GET /api/gamification/inventory - Get user's inventory
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromCookie(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inventory = await prisma.inventory.findMany({
      where: {
        userId,
        quantity: { gt: 0 },
      },
      include: {
        item: true,
      },
      orderBy: [{ item: { type: "asc" } }, { createdAt: "desc" }],
    });

    return NextResponse.json({ inventory });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}
