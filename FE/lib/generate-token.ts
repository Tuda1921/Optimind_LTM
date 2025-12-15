"use server";
import { getCurrentUser } from "@/utils/auth-server";
import { StreamClient } from "@stream-io/node-sdk";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string | undefined;
const apiSecret = process.env.STREAM_SECRET_KEY as string | undefined;

/**
 * Generate a short-lived Stream token for a given user.
 * Returns a Promise that resolves to the token string.
 */
export const tokenProvider = async (): Promise<string> => {
	const user = await getCurrentUser();

	if (!user) throw new Error("User is not logged in");
	if (!apiKey) throw new Error("No API key");
	if (!apiSecret) throw new Error("No API secret");

	const client = new StreamClient(apiKey, apiSecret);

	const exp = Math.round(new Date().getTime() / 1000) + 60 * 60; // 1 hour
	const issued = Math.floor(Date.now() / 1000) - 60;

	// generateUserToken shape may vary by SDK version — cast to string to satisfy TS
	const token = client.generateUserToken({
		user_id: user.id,
		exp: exp,
		iat: issued,
	}) as string;

	return token;
};

export default tokenProvider;
// ...existing code...
