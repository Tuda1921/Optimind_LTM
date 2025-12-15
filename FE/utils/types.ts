// User types
export interface User {
	id: string;
	email: string;
	username?: string;
	created_at?: string;
	updated_at?: string;
}

// Auth response types
export interface AuthResponse {
	user: User | null;
	token?: string;
	error?: string;
}

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface SignupCredentials {
	email: string;
	password: string;
	username: string;
}

// API response type
export interface ApiResponse<T = any> {
	data?: T;
	error?: string;
	message?: string;
}
