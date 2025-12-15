import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	// Skip middleware for API routes
	if (request.nextUrl.pathname.startsWith("/api")) {
		return NextResponse.next();
	}

	const path = request.nextUrl.pathname;

	// Public pages (no auth required)
	const publicPaths = new Set<string>([
		"/", "/login", "/register", "/test-ws",
		"/study"
	]);
	if (publicPaths.has(path)) return NextResponse.next();

	// Auth check for the rest
	// Check for auth_token cookie (set by server) or user_data cookie (set by client)
	const token = request.cookies.get("auth_token")?.value;
	const userData = request.cookies.get("user_data")?.value;

	if (!token && !userData) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * Feel free to modify this pattern to include more paths.
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
