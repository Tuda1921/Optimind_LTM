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

// GET /api/preferences - Fetch user preferences
export async function GET(req: Request) {
	try {
		const userId = getUserIdFromCookie(req);
		if (!userId) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const preferences = await prisma.userPreferences.findUnique({
			where: { userId },
		});

		// If preferences don't exist, create defaults
		if (!preferences) {
			const newPreferences = await prisma.userPreferences.create({
				data: {
					userId,
				},
			});
			return NextResponse.json({ preferences: newPreferences });
		}

		return NextResponse.json({ preferences });
	} catch (err) {
		console.error("Failed to fetch preferences:", err);
		return NextResponse.json(
			{ error: "Failed to fetch preferences" },
			{ status: 500 }
		);
	}
}

// PUT /api/preferences - Update user preferences
export async function PUT(req: Request) {
	try {
		const userId = getUserIdFromCookie(req);
		if (!userId) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const body = await req.json();
		const {
			backgroundUrl,
			musicVolume,
			currentTrack,
			cameraX,
			cameraY,
			cameraWidth,
			cameraHeight,
			isCameraEnabled,
			isMicEnabled,
			theme,
		} = body;

		// Find or create preferences
		let preferences = await prisma.userPreferences.findUnique({
			where: { userId },
		});

		if (!preferences) {
			preferences = await prisma.userPreferences.create({
				data: {
					userId,
				},
			});
		}

		// Update preferences
		const updatedPreferences = await prisma.userPreferences.update({
			where: { userId },
			data: {
				...(backgroundUrl !== undefined && { backgroundUrl }),
				...(musicVolume !== undefined && { musicVolume }),
				...(currentTrack !== undefined && { currentTrack }),
				...(cameraX !== undefined && { cameraX }),
				...(cameraY !== undefined && { cameraY }),
				...(cameraWidth !== undefined && { cameraWidth }),
				...(cameraHeight !== undefined && { cameraHeight }),
				...(isCameraEnabled !== undefined && { isCameraEnabled }),
				...(isMicEnabled !== undefined && { isMicEnabled }),
				...(theme !== undefined && { theme }),
			},
		});

		return NextResponse.json({ preferences: updatedPreferences });
	} catch (err) {
		console.error("Failed to update preferences:", err);
		return NextResponse.json(
			{ error: "Failed to update preferences" },
			{ status: 500 }
		);
	}
}
