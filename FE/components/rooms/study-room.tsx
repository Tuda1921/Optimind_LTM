import { LayoutList, User2Icon } from "lucide-react";
import React, { useState } from "react";

import {
	CallControls,
	CallingState,
	CallParticipantsList,
	CancelCallButton,
	PaginatedGridLayout,
	SpeakerLayout,
	ToggleAudioPublishingButton,
	ToggleVideoPublishingButton,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { cn } from "@/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import EndCallButton from "./end-call-button";
import Loader from "./loader";

const glassEffect =
	"bg-black/30 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

type CallLayoutType = "grid" | "speaker-left" | "speaker-right";

const MeetingRoom = () => {
	const searchParams = useSearchParams();
	const isPersonalRoom = !!searchParams.get("personal");
	const router = useRouter();
	const [layout, setLayout] = useState<CallLayoutType>("grid");
	const [showParticipants, setShowParticipants] = useState(true);
	const { useCallCallingState } = useCallStateHooks();
	const callingState = useCallCallingState();

	if (callingState !== CallingState.JOINED) return <Loader />;

	const CallLayout = () => {
		switch (layout) {
			case "grid":
				return <PaginatedGridLayout />;
			case "speaker-right":
				return <SpeakerLayout participantsBarPosition="left" />;
			default:
				return <SpeakerLayout participantsBarPosition="right" />;
		}
	};

	return (
		<div
			className={cn(
				"absolute top-1/10 left-1/2 -translate-x-1/2 w-fit py-6 px-3", // Vị trí
				glassEffect
				// "overflow-hidden"
			)}
		>
			<div className="flex flex-col justify-center items-center w-full">
				<div className={cn("flex justify-center h-115 mb-4 w-fit")}>
					<div className="w-full max-w-160 aspect-video">
						{showParticipants ? (
							<CallLayout />
						) : (
							<PaginatedGridLayout />
						)}
					</div>
					<div
						className={cn(
							"h-full pl-10",
							showParticipants && "hidden"
						)}
					>
						<CallParticipantsList
							onClose={() => setShowParticipants(false)}
						/>
					</div>
				</div>
				<div className="flex flex-row w-full items-center justify-center gap-5">
					<ToggleAudioPublishingButton />
					<ToggleVideoPublishingButton />
					<CancelCallButton onLeave={() => router.push("/rooms")} />
					<DropdownMenu>
						<div className="flex items-center">
							<DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  ">
								<LayoutList
									size={20}
									className="text-white bg-gray-800"
								/>
							</DropdownMenuTrigger>
						</div>
						<DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
							{["Grid", "Speaker-Left", "Speaker-Right"].map(
								(item, index) => (
									<div key={index}>
										<DropdownMenuItem
											onClick={() =>
												setLayout(
													item.toLowerCase() as CallLayoutType
												)
											}
										>
											{item}
										</DropdownMenuItem>
										<DropdownMenuSeparator className="border-dark-1" />
									</div>
								)
							)}
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						onClick={() => setShowParticipants((prev) => !prev)}
					>
						<div className="cursor-pointer rounded-2xl bg-[19232d] px-4 py-2">
							<User2Icon size={20} className="text-white" />
						</div>
					</Button>
					{!isPersonalRoom && <EndCallButton />}
				</div>
			</div>
		</div>
	);
};

export default MeetingRoom;
