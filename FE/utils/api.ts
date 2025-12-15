// API utility functions for communicating with your custom backend
import { ApiResponse } from "./types";

// Base URL for your backend API
// You can set this in your .env.local file as NEXT_PUBLIC_API_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface RequestOptions extends RequestInit {
	token?: string;
}

/**
 * Generic API call function
 */
export async function apiCall<T = any>(
	endpoint: string,
	options: RequestOptions = {}
): Promise<ApiResponse<T>> {
	const { token, ...fetchOptions } = options;

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...((fetchOptions.headers as Record<string, string>) || {}),
	};

	// Add authorization header if token is provided
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			...fetchOptions,
			headers,
		});

		const data = await response.json();

		if (!response.ok) {
			return {
				error: data.message || data.error || "An error occurred",
			};
		}

		return { data };
	} catch (error) {
		console.error("API call error:", error);
		return {
			error: error instanceof Error ? error.message : "Network error",
		};
	}
}

/**
 * GET request
 */
export async function get<T = any>(
	endpoint: string,
	token?: string
): Promise<ApiResponse<T>> {
	return apiCall<T>(endpoint, {
		method: "GET",
		token,
	});
}

/**
 * POST request
 */
export async function post<T = any>(
	endpoint: string,
	body: any,
	token?: string
): Promise<ApiResponse<T>> {
	return apiCall<T>(endpoint, {
		method: "POST",
		body: JSON.stringify(body),
		token,
	});
}

/**
 * PUT request
 */
export async function put<T = any>(
	endpoint: string,
	body: any,
	token?: string
): Promise<ApiResponse<T>> {
	return apiCall<T>(endpoint, {
		method: "PUT",
		body: JSON.stringify(body),
		token,
	});
}

/**
 * DELETE request
 */
export async function del<T = any>(
	endpoint: string,
	token?: string
): Promise<ApiResponse<T>> {
	return apiCall<T>(endpoint, {
		method: "DELETE",
		token,
	});
}
