// Tên file: app/components/rooms/BattleRoomView.tsx
"use client";

import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { User, Send, DoorOpen, Swords, Brain } from "lucide-react";
import { Room, RoomType } from "@/app/(api)/rooms/page";

interface BattleRoomViewProps {
	room: Room;
	onLeaveRoom: () => void;
}

const BattleRoomView: FC<BattleRoomViewProps> = ({ room, onLeaveRoom }) => {
	return (
		<div className="flex flex-col h-fit">
			{/* Header phòng thi đấu */}
			<div className="flex justify-between items-center p-4 border-b border-white/10">
				<h2 className="text-2xl font-bold flex items-center gap-2">
					<Swords className="w-6 h-6 text-red-400" />
					{room.name}
				</h2>
				<Button
					variant="destructive"
					className="gap-2"
					onClick={onLeaveRoom}
				>
					<DoorOpen className="w-5 h-5" />
					Rời phòng
				</Button>
			</div>
			{/* Nội dung phòng (Battle + Chat) */}
			<div className="flex flex-1 overflow-hidden">
				{/* Khu vực thi đấu */}
				<div className="flex-1 p-6 flex flex-col items-center justify-center gap-6">
					<p className="text-xl font-semibold">
						Thời gian còn lại: 59:30
					</p>
					{/* Thanh điểm tập trung */}
					<div className="flex flex-row items-center gap-4 px-6">
						<div className="flex items-center gap-2">
							<Brain className="w-6 h-6 text-blue-300" />
							<span className="text-3xl font-bold">92%</span>
						</div>
						<Separator
							orientation="vertical"
							className="h-20 bg-white/30"
						/>
						<span className="text-2xl font-bold text-gray-400">
							VS
						</span>
						<Separator
							orientation="vertical"
							className="h-20 bg-white/30"
						/>
						<div className="flex items-center gap-2">
							<Brain className="w-6 h-6 text-red-300" />
							<span className="text-3xl font-bold">88%</span>
						</div>
					</div>
					<div className="flex w-full items-center justify-around">
						{/* Người chơi 1 (Bạn) */}
						<div className="flex flex-col items-center gap-2">
							<div className="w-full h-36 aspect-video rounded-lg bg-black/50 flex items-center justify-center border-2 border-blue-500 relative overflow-hidden">
								<User size={64} className="opacity-30" />
								<span className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-sm">
									Bạn
								</span>
							</div>
							<p className="text-lg font-semibold">Bạn</p>
						</div>

						{/* Người chơi 2 (Đối thủ) */}
						<div className="flex flex-col items-center gap-2">
							<div className="w-full h-36 aspect-video rounded-lg bg-black/50 flex items-center justify-center border-2 border-gray-500 relative overflow-hidden">
								<User size={64} className="opacity-30" />
								<span className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-sm">
									Minh Anh
								</span>
							</div>
							<p className="text-lg font-semibold">Minh Anh</p>
						</div>
					</div>
				</div>

				{/* Khung Chat (giữ nguyên) */}
				<aside className="w-80 flex flex-col border-l border-white/10 bg-white/5">
					<h3 className="p-4 text-lg font-semibold border-b border-white/10">
						Chat
					</h3>
					<ScrollArea className="flex-1 p-4">
						<p className="text-sm text-gray-300">
							Minh Anh: Sẵn sàng chưa?
						</p>
						<p className="text-sm text-white">Bạn: Vào thôi!</p>
					</ScrollArea>
					<div className="p-4 border-t border-white/10">
						<form className="flex gap-2">
							<Input
								placeholder="Nhập..."
								className="bg-white/10 border-white/20"
							/>
							<Button size="icon">
								<Send className="w-4 h-4" />
							</Button>
						</form>
					</div>
				</aside>
			</div>
		</div>
	);
};

export default BattleRoomView;
