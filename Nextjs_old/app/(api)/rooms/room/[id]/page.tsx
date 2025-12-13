"use client";

import { useState, useEffect, use } from "react";

import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";

import { getCallById } from "@/hooks/useCall";
import RoomSetUp from "@/components/rooms/room-setup";
import Loader from "@/components/rooms/loader";
import MeetingRoom from "@/components/rooms/study-room";
import { useParams } from "next/navigation";

const Room = () => {
	const params = useParams<{ id: string }>();
	const { id } = params;

	const [isSetUpComplete, setIsSetUpComplete] = useState(false);
	const { call, isCallLoading } = getCallById(id);

	if (isCallLoading) return <Loader />;

	return (
		<div className="space-y-3">
			<StreamCall call={call}>
				<StreamTheme>
					{!isSetUpComplete ? (
						<RoomSetUp setIsSetupComplete={setIsSetUpComplete} />
					) : (
						<MeetingRoom />
					)}
				</StreamTheme>
			</StreamCall>
		</div>
	);
};

export default Room;
