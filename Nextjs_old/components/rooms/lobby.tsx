// Tên file: app/components/rooms/RoomBrowser.tsx
"use client";

import React, { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { User } from "@/utils/types";

interface RoomBrowserProps {
	user: User | null;
}

const RoomBrowser: FC<RoomBrowserProps> = ({ user }) => {
	const client = useStreamVideoClient();
	const router = useRouter();
	const [values, setValues] = useState({
		dateTime: new Date(),
		description: "",
		link: "",
	});

	const [callDetails, setCallDetails] = useState<Call | null>();

	const createRoom = async () => {
		if (!client || !user) return;
		console.log(user);

		try {
			const id = crypto.randomUUID();
			const call = client.call("default", id);

			if (!call) throw new Error("Failed to create call");

			const startAt =
				values.dateTime.toISOString() ||
				new Date(Date.now()).toISOString();
			const description = values.description || "Instant Room";

			await call.getOrCreate({
				data: {
					starts_at: startAt,
					custom: {
						description,
					},
				},
			});

			setCallDetails(call);

			if (!values.description) {
				router.push(`/rooms/room/${call.id}`);
			}
			toast.success("Room created");
		} catch (error) {
			toast.error("Failed to create room");
		}
	};

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex justify-between items-center p-6 border-b border-white/10">
				<h2 className="text-3xl font-bold">Phòng Học Chung</h2>
				<Button
					className="gap-2 bg-blue-600 hover:bg-blue-700"
					onClick={createRoom}
				>
					<Plus className="w-5 h-5" />
					Tạo phòng
				</Button>
			</div>
			{/* Tabs */}
			{/* <Tabs defaultValue="study" className="flex flex-col flex-1">
				<TabsList className="grid w-full grid-cols-2 bg-white/10 text-white rounded-none">
					<TabsTrigger value="study">Phòng học</TabsTrigger>
					<TabsTrigger value="battle">Phòng thi đấu</TabsTrigger>
				</TabsList>
				<TabsContent value="study" className="flex-1 overflow-hidden">
					<ScrollArea className="h-[500px] p-6">
						
						<div className="flex flex-col gap-4">
							{studyRooms.map((room) => (
								<div
									key={room.id}
									className="flex items-center justify-between rounded-lg bg-white/10 p-4"
								>
									<div className="flex items-center gap-4">
										<Avatar className="h-12 w-12">
											<AvatarFallback>
												<Users2 />
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="text-lg font-semibold">
												{room.name}
											</p>
											<div className="flex gap-4 text-sm text-gray-300">
												<span className="flex items-center gap-1">
													<UserCheck className="w-4 h-4" />{" "}
													{room.host}
												</span>
												<span className="flex items-center gap-1">
													<Users2 className="w-4 h-4" />{" "}
													{room.participants}/
													{room.max}
												</span>
											</div>
										</div>
									</div>
									<Button
										className="gap-2"
										onClick={() =>
											onJoinRoom(room, "study")
										}
									>
										<LogIn className="w-4 h-4" /> Tham gia
									</Button>
								</div>
							))}
						</div>
					</ScrollArea>
				</TabsContent>
				<TabsContent value="battle" className="flex-1 overflow-hidden">
					<ScrollArea className="h-[500px] p-6">
						<div className="flex flex-col gap-4">
							{battleRooms.map((room) => (
								<div
									key={room.id}
									className="flex items-center justify-between rounded-lg bg-white/10 p-4"
								>
									<div className="flex items-center gap-4">
										<Avatar className="h-12 w-12">
											<AvatarFallback>
												<Swords />
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="text-lg font-semibold">
												{room.name}
											</p>
											<div className="flex gap-4 text-sm text-gray-300">
												<span className="flex items-center gap-1">
													<UserCheck className="w-4 h-4" />{" "}
													{room.host}
												</span>
												<span className="flex items-center gap-1">
													<Users2 className="w-4 h-4" />{" "}
													{room.participants}/
													{room.max}
												</span>
											</div>
										</div>
									</div>
									<Button
										className="gap-2"
										onClick={() =>
											onJoinRoom(room, "battle")
										}
									>
										<LogIn className="w-4 h-4" /> Tham gia
									</Button>
								</div>
							))}
						</div>
					</ScrollArea>
				</TabsContent>
			</Tabs> */}
		</div>
	);
};

export default RoomBrowser;
