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

// GET /api/friends - Get friends list
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromCookie(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          {
            user1Id: userId,
            status: status || undefined,
          },
          {
            user2Id: userId,
            status: status || undefined,
          },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            level: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            level: true,
          },
        },
      },
    });

    // Map to friendships with the other user's data
    const friends = friendships.map((f: any) => ({
      id: f.id,
      status: f.status,
      createdAt: f.createdAt,
      friend: f.user1Id === userId ? f.user2 : f.user1,
      isRequester: f.user1Id === userId,
    }));

    return NextResponse.json({ friends });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}

// POST /api/friends - Send friend request
export async function POST(req: Request) {
  try {
    const userId = getUserIdFromCookie(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { friendId } = body;

    if (!friendId) {
      return NextResponse.json({ error: "friendId is required" }, { status: 400 });
    }

    if (friendId === userId) {
      return NextResponse.json({ error: "Cannot add yourself as friend" }, { status: 400 });
    }

    // Check if friendship already exists
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Friendship already exists" }, { status: 400 });
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        user1Id: userId,
        user2Id: friendId,
        status: "pending",
      },
      include: {
        user2: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            level: true,
          },
        },
      },
    });

    return NextResponse.json({ friendship });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }
}
