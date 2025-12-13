import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	// Skip middleware for API routes
	if (request.nextUrl.pathname.startsWith("/api")) {
		return NextResponse.next();
	}

	// Read auth token directly from request cookies in middleware
	const token = request.cookies.get("auth_token")?.value || null;
	const isAuthPage = request.nextUrl.pathname.startsWith("/login") || 
	                   request.nextUrl.pathname.startsWith("/register");
	
	// If user is not authenticated and trying to access protected pages
	if (!token && !isAuthPage && request.nextUrl.pathname !== "/") {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}
	
	// If user is authenticated and trying to access auth pages
	if (token && isAuthPage) {
		const url = request.nextUrl.clone();
		url.pathname = "/study";
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
