// Tên file: app/components/rooms/RoomSetUp.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
	Call,
	DeviceSettings,
	useCall,
	VideoPreview,
} from "@stream-io/video-react-sdk";
import React, { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react"; // Thêm icon
import { cn } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

// Hàm tiện ích
const glassEffect =
	"bg-black/50 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg";

interface RoomSetUpProps {
	setIsSetupComplete: (value: boolean) => void;
}

const RoomSetUp: React.FC<RoomSetUpProps> = ({ setIsSetupComplete }) => {
	const [isMicCamToggled, setIsMicCamToggled] = useState<boolean>(false);

	const call = useCall() as Call;

	if (!call) {
		throw new Error(
			"useStreamCall must be used within a StreamCall component."
		);
	}

	useEffect(() => {
		if (!call) return;
		if (isMicCamToggled) {
			call?.camera.disable();
			call?.microphone.disable();
		} else {
			call?.camera.enable();
			call?.microphone.enable();
		}
	}, [isMicCamToggled, call?.camera, call?.microphone]);

	return (
		// Áp dụng Glass Effect cho container
		<div
			className={cn(
				"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex w-full max-w-xl flex-col items-center justify-center gap-6 p-6",
				glassEffect
			)}
		>
			{/* Tiêu đề */}
			<h1 className="text-center text-3xl font-bold text-white">
				Cài đặt trước khi tham gia
			</h1>

			{/* Khung Preview Video */}
			<div className="flex flex-col w-full justify-center items-center gap-4">
				<VideoPreview className="max-h-70" />
			</div>

			{/* Nút điều khiển và Device Settings */}
			<div className="flex items-center justify-center gap-6">
				<Label htmlFor="mic-cam-toggle p-0">
					<input
						id="mic-cam-toggle"
						type="checkbox"
						checked={isMicCamToggled}
						onChange={(e) => setIsMicCamToggled(e.target.checked)}
					/>
					Join with mic cam off
				</Label>
				{/* Device Settings */}
				<div className="text-white">
					<DeviceSettings />
				</div>
			</div>

			{/* Nút Tham gia */}
			<Button
				className="rounded-full bg-green-500 hover:bg-green-600 px-6 py-3 text-lg font-semibold"
				onClick={() => {
					call.join();
					setIsSetupComplete(true);
				}}
			>
				Tham gia phòng
			</Button>
		</div>
	);
};

export default RoomSetUp;
