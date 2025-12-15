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

// GET /api/sessions/analytics - Get analytics
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromCookie(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "week"; // week, month, year

    const now = new Date();
    let startDate = new Date();

    if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        startTime: { gte: startDate },
        endTime: { not: null },
      },
      include: {
        focusLogs: {
          select: { score: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Calculate stats
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum: number, s: any) => sum + (s.duration || 0) / 60, 0);
    const avgFocusScore =
      sessions.length > 0
        ? sessions.reduce((sum: number, s: any) => sum + (s.focusScore || 0), 0) / sessions.length
        : 0;
    const totalCoins = sessions.reduce((sum: number, s: any) => sum + s.coinsEarned, 0);
    const totalExp = sessions.reduce((sum: number, s: any) => sum + s.expEarned, 0);

    return NextResponse.json({
      analytics: {
        period,
        totalSessions,
        totalMinutes: Math.round(totalMinutes),
        avgFocusScore: Math.round(avgFocusScore * 10) / 10,
        totalCoins,
        totalExp,
        sessions: sessions.map((s: any) => ({
          date: s.startTime,
          duration: s.duration,
          focusScore: s.focusScore,
        })),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
