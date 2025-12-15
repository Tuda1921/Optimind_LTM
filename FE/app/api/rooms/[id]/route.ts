import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/rooms/[id] - Get room details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, email: true, avatarUrl: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        messages: {
          include: {
            user: {
              select: { id: true, username: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 });
  }
}
