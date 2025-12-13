// Tên file: app/study-room/page.tsx
"use server";

import { FC } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import RoomBrowser from "@/components/rooms/lobby";
import { getCurrentUser } from "@/utils/auth-server";

// --- Định nghĩa Types ---
export interface Room {
	// MỚI: Export để component con có thể dùng
	id: string;
	name: string;
	host: string;
	participants: number;
	max: number;
}
export type RoomState = "browsing" | "prejoin" | "in_room"; // MỚI: Export
export type RoomType = "study" | "battle" | null; // MỚI: Export

// --- Component Chính ---
const StudyRoomPage: FC = async () => {
	// Hàm tiện ích (GIỮ NGUYÊN)
	const glassEffect =
		"bg-black/30 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

	const user = await getCurrentUser();

	// --- Render ---
	return (
		<TooltipProvider>
			<main className="h-screen w-screen text-white p-6 transition-all duration-500">
				<div className="relative w-full h-full">
					{/* === NỘI DUNG CHÍNH (THAY ĐỔI THEO STATE) === */}
					<div
						className={cn(
							"absolute w-[900px] h-fit left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col",
							glassEffect,
							"overflow-hidden" // Đảm bảo các con không bị tràn
						)}
					>
						<RoomBrowser user={user} />
					</div>
				</div>
			</main>
		</TooltipProvider>
	);
};

export default StudyRoomPage;
