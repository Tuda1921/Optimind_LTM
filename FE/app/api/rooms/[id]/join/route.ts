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

// POST /api/rooms/[id]/join - Join room
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromCookie(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: roomId } = await params;
    const body = await req.json();
    const { password } = body;

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (!room.isActive) {
      return NextResponse.json({ error: "Room is not active" }, { status: 400 });
    }

    if (room._count.members >= room.maxMembers) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 });
    }

    if (room.password && room.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 403 });
    }

    // Check if already a member
    const existing = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }

    // Join room
    const member = await prisma.roomMember.create({
      data: {
        roomId,
        userId,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    return NextResponse.json({ member });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}
