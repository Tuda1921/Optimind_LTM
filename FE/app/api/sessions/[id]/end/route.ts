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

// PUT /api/sessions/[id]/end - End study session
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromCookie(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId } = await params;

    // Verify session belongs to user
    const session = await prisma.studySession.findFirst({
      where: { id: sessionId, userId },
      include: {
        focusLogs: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.endTime) {
      return NextResponse.json({ error: "Session already ended" }, { status: 400 });
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

    // Calculate average focus score from focus logs
    const avgFocusScore =
      session.focusLogs.length > 0
        ? session.focusLogs.reduce((sum: number, log: any) => sum + log.score, 0) / session.focusLogs.length
        : 0;

    // Calculate duration in minutes
    const durationMinutes = Math.floor(duration / 60);

    // Calculate coins based on focus score tiers
    let coinsPerMinute = 1; // Base: 1 coin/min for low focus
    if (avgFocusScore >= 67) {
      coinsPerMinute = 3; // High focus: 3 coin/min
    } else if (avgFocusScore >= 34) {
      coinsPerMinute = 2; // Medium focus: 2 coin/min
    }
    const coinsEarned = durationMinutes * coinsPerMinute;

    // Calculate XP: base XP + focus bonus
    const baseXP = durationMinutes * 5; // 5 XP per minute
    const focusBonus = Math.floor(avgFocusScore / 10) * 10; // 10 XP per 10% focus
    const expEarned = baseXP + focusBonus;

    // Update pet happiness based on focus
    const pet = await prisma.pet.findUnique({
      where: { userId },
    });

    let petHappinessUpdate = 0;
    if (avgFocusScore >= 70) {
      petHappinessUpdate = Math.floor(avgFocusScore / 10); // +7 happiness for high focus
    }

    // Update session and user
    const [updatedSession] = await prisma.$transaction([
      prisma.studySession.update({
        where: { id: sessionId },
        data: {
          endTime,
          duration,
          focusScore: avgFocusScore,
          coinsEarned,
          expEarned,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          coins: { increment: coinsEarned },
          experience: { increment: expEarned },
        },
      }),
      // Update pet happiness if exists
      ...(pet && petHappinessUpdate > 0
        ? [
            prisma.pet.update({
              where: { userId },
              data: {
                happiness: {
                  increment: petHappinessUpdate,
                },
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ session: updatedSession });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
  }
}
