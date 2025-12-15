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

// GET /api/leaderboards - Get leaderboards
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromCookie(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "global";
    const limit = parseInt(url.searchParams.get("limit") || "50");

    let users;

    if (type === "friends") {
      // Get user's friends
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { user1Id: userId, status: "accepted" },
            { user2Id: userId, status: "accepted" },
          ],
        },
      });

      const friendIds = friendships.map((f: any) =>
        f.user1Id === userId ? f.user2Id : f.user1Id
      );

      // Get leaderboard for friends + user
      users = await prisma.user.findMany({
        where: {
          id: { in: [...friendIds, userId] },
        },
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
          level: true,
          exp: true,
          coins: true,
        },
        orderBy: [{ level: "desc" }, { exp: "desc" }],
        take: limit,
      });
    } else {
      // Global leaderboard
      users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
          level: true,
          exp: true,
          coins: true,
        },
        orderBy: [{ level: "desc" }, { exp: "desc" }],
        take: limit,
      });
    }

    // Add rank
    const leaderboard = users.map((user: any, index: number) => ({
      ...user,
      rank: index + 1,
    }));

    return NextResponse.json({ leaderboard });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
