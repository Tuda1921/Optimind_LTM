"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { login as authLogin, signup as authSignup } from "@/utils/auth-server";

export async function login({
	email,
	password,
}: {
	email: string;
	password: string;
}) {
	const { user, error } = await authLogin({ email, password });

	if (error || !user) {
		redirect("/error");
	}

	revalidatePath("/", "layout");
	redirect("/study");
}

export async function signup({
	username,
	email,
	password,
}: {
	username: string;
	email: string;
	password: string;
}) {
	const { user, error } = await authSignup({ username, email, password });

	if (error || !user) {
		redirect("/error");
	}

	revalidatePath("/", "layout");
	redirect("/login");
}
