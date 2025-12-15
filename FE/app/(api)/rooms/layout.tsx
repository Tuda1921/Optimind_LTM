"use server";

import StreamVideoProvider from "@/hooks/useStream";
import { getCurrentUser } from "@/utils/auth-server";
import React from "react";

const StudyRoomLayout = async ({ children }: { children: React.ReactNode }) => {
	const user = await getCurrentUser();

	return <StreamVideoProvider user={user}>{children}</StreamVideoProvider>;
};

export default StudyRoomLayout;
