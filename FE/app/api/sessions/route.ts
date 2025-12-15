import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper to get userId from cookie
function getUserIdFromCookie(req: Request): string | null {
  const cookie = req.headers.get("cookie") || "";
  const userCookie = cookie
    .split(";")
    .find((c) => c.trim().startsWith("user_data="));
  
  if (!userCookie) return null;
  
  try {
    const value = decodeURIComponent(userCookie.split("=")[1]);
    const user = JSON.parse(value);
    return user.id;
  } catch {
    return null;
  }
}

// POST /api/sessions/start - Start new study session
export async function POST(req: Request) {
  try {
    const userId = getUserIdFromCookie(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { taskTitle, pomodoroCount } = body;

    const session = await prisma.studySession.create({
      data: {
        userId,
        taskTitle,
        pomodoroCount: pomodoroCount || 0,
      },
    });

    return NextResponse.json({ session });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}

// GET /api/sessions/history - Get study history
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromCookie(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const sessions = await prisma.studySession.findMany({
      where: { userId },
      include: {
        focusLogs: {
          select: { score: true, timestamp: true },
        },
      },
      orderBy: { startTime: "desc" },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({ sessions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
