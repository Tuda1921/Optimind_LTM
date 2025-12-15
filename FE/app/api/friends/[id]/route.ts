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

// PUT /api/friends/[id] - Accept/reject friend request
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromCookie(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be accept or reject" },
        { status: 400 }
      );
    }

    // Check friendship exists and user is the recipient
    const friendship = await prisma.friendship.findFirst({
      where: {
        id,
        user2Id: userId,
        status: "pending",
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
    }

    if (action === "reject") {
      await prisma.friendship.delete({
        where: { id },
      });
      return NextResponse.json({ message: "Friend request rejected" });
    }

    // Accept
    const updated = await prisma.friendship.update({
      where: { id },
      data: { status: "accepted" },
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
      },
    });

    return NextResponse.json({ friendship: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update friend request" }, { status: 500 });
  }
}

// DELETE /api/friends/[id] - Remove friend
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromCookie(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check friendship exists and user is part of it
    const friendship = await prisma.friendship.findFirst({
      where: {
        id,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
    }

    await prisma.friendship.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Friend removed" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to remove friend" }, { status: 500 });
  }
}
