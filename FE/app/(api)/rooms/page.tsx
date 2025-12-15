// Tên file: app/study-room/page.tsx
"use client";

import { useState, useEffect, FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Users, Lock, LogIn, Plus } from "lucide-react";

// --- Định nghĩa Types ---
export interface Room {
	id: string;
	name: string;
	hostId: string;
	hostName?: string;
	maxMembers: number;
	members?: any[];
	isPrivate: boolean;
	createdAt: string;
}

export type RoomType = Room;

// --- Component Chính ---
const StudyRoomPage: FC = () => {
	const [rooms, setRooms] = useState<Room[]>([]);
	const [loading, setLoading] = useState(true);
	const [isCreatingRoom, setIsCreatingRoom] = useState(false);
	const [newRoomName, setNewRoomName] = useState("");
	const [newRoomMax, setNewRoomMax] = useState(4);
	const [newRoomPassword, setNewRoomPassword] = useState("");
	const [joinRoomId, setJoinRoomId] = useState<string | null>(null);
	const [joinPassword, setJoinPassword] = useState("");

	useEffect(() => {
		fetchRooms();
	}, []);

	const fetchRooms = async () => {
		try {
			setLoading(true);
			const res = await fetch("/api/rooms");
			if (res.ok) {
				const data = await res.json();
				setRooms(data.rooms);
			}
		} catch (error) {
			console.error("Failed to fetch rooms:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateRoom = async () => {
		try {
			const res = await fetch("/api/rooms", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: newRoomName,
					maxMembers: newRoomMax,
					password: newRoomPassword || undefined,
				}),
			});

			if (res.ok) {
				const data = await res.json();
				setRooms([...rooms, data.room]);
				setNewRoomName("");
				setNewRoomMax(4);
				setNewRoomPassword("");
				setIsCreatingRoom(false);
				alert("Room created successfully!");
			}
		} catch (error) {
			console.error("Failed to create room:", error);
			alert("Failed to create room");
		}
	};

	const handleJoinRoom = async (roomId: string) => {
		try {
			const res = await fetch(`/api/rooms/${roomId}/join`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					password: joinPassword || undefined,
				}),
			});

			if (res.ok) {
				alert("Joined room successfully!");
				setJoinRoomId(null);
				setJoinPassword("");
				fetchRooms();
			} else {
				const error = await res.json();
				alert(error.message || "Failed to join room");
			}
		} catch (error) {
			console.error("Failed to join room:", error);
			alert("Failed to join room");
		}
	};

	const glassEffect = "bg-black/30 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

	return (
		<TooltipProvider>
			<main className="h-screen w-screen text-white p-6 transition-all duration-500">
				<div className="max-w-6xl mx-auto space-y-6">
					{/* Header */}
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold">Phòng Học</h1>
							<p className="text-muted-foreground">Học tập cùng mọi người</p>
						</div>
						<Dialog open={isCreatingRoom} onOpenChange={setIsCreatingRoom}>
							<DialogTrigger asChild>
								<Button className="gap-2">
									<Plus className="w-4 h-4" /> Tạo Phòng Mới
								</Button>
							</DialogTrigger>
							<DialogContent className={glassEffect}>
								<DialogHeader>
									<DialogTitle>Tạo Phòng Học Mới</DialogTitle>
								</DialogHeader>
								<div className="space-y-4">
									<div>
										<Label>Tên Phòng</Label>
										<Input
											value={newRoomName}
											onChange={(e) => setNewRoomName(e.target.value)}
											placeholder="Nhập tên phòng"
										/>
									</div>
									<div>
										<Label>Số Thành Viên Tối Đa</Label>
										<Input
											type="number"
											min="2"
											max="10"
											value={newRoomMax}
											onChange={(e) => setNewRoomMax(parseInt(e.target.value))}
										/>
									</div>
									<div>
										<Label>Mật Khẩu (Tùy Chọn)</Label>
										<Input
											type="password"
											value={newRoomPassword}
											onChange={(e) => setNewRoomPassword(e.target.value)}
											placeholder="Để trống nếu không cần"
										/>
									</div>
									<Button onClick={handleCreateRoom} className="w-full">
										Tạo Phòng
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					</div>

					{/* Rooms Grid */}
					{loading ? (
						<div className="text-center">Loading...</div>
					) : rooms.length === 0 ? (
						<Card className={glassEffect}>
							<CardContent className="py-12 text-center">
								<Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
								<p className="text-muted-foreground">Chưa có phòng. Hãy tạo một phòng mới!</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{rooms.map((room) => (
								<Card key={room.id} className={cn(glassEffect, "hover:shadow-lg transition")}>
									<CardHeader>
										<div className="flex items-start justify-between">
											<CardTitle className="text-lg">{room.name}</CardTitle>
											{room.isPrivate && <Lock className="w-4 h-4" />}
										</div>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="space-y-2">
											<p className="text-sm text-muted-foreground">
												<Users className="w-4 h-4 inline mr-2" />
												{room.members?.length || 0} / {room.maxMembers} thành viên
											</p>
											<p className="text-sm text-muted-foreground">
												Chủ phòng: {room.hostName || "Unknown"}
											</p>
										</div>

										<Dialog open={joinRoomId === room.id} onOpenChange={(open) => {
											if (!open) setJoinRoomId(null);
										}}>
											<DialogTrigger asChild>
												<Button
													onClick={() => setJoinRoomId(room.id)}
													disabled={(room.members?.length || 0) >= room.maxMembers}
													className="w-full gap-2"
												>
													<LogIn className="w-4 h-4" /> Tham Gia
												</Button>
											</DialogTrigger>
											<DialogContent className={glassEffect}>
												<DialogHeader>
													<DialogTitle>Tham Gia Phòng: {room.name}</DialogTitle>
												</DialogHeader>
												{room.isPrivate && (
													<div>
														<Label>Mật Khẩu</Label>
														<Input
															type="password"
															value={joinPassword}
															onChange={(e) => setJoinPassword(e.target.value)}
															placeholder="Nhập mật khẩu"
														/>
													</div>
												)}
												<Button
													onClick={() => handleJoinRoom(room.id)}
													className="w-full"
												>
													Tham Gia
												</Button>
											</DialogContent>
										</Dialog>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</div>
			</main>
		</TooltipProvider>
	);
};

export default StudyRoomPage;
