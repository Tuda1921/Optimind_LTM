// ...existing code...
"use client";

import React, { useEffect, useState } from "react";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import { tokenProvider } from "@/lib/generate-token";
import Loader from "@/components/rooms/loader";
import { User } from "@/utils/types";

interface StreamVideoProviderProps {
	user: User | null;
	children: React.ReactNode;
}

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string | undefined;

export const StreamVideoProvider: React.FC<StreamVideoProviderProps> = ({
	user,
	children,
}) => {
	const [videoClient, setVideoClient] = useState<StreamVideoClient>();

	useEffect(() => {
		if (!user) return;
		if (!apiKey) throw new Error("Stream API key missing");

		const client = new StreamVideoClient({
			apiKey,
			user: {
				id: user.id,
				name: user.email || "",
				// image: user.avatarUrl || "",
			},
			tokenProvider: tokenProvider,
		});

		setVideoClient(client);
	}, [user]);

	if (!videoClient) return <Loader />;

	return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
// ...existing code...
