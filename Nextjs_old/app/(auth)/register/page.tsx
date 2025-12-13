"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import {
	Brain,
	Mail,
	Lock,
	Chrome,
	ArrowLeft,
	MailCheck,
	User, // MỚI: Icon cho Tên người dùng
} from "lucide-react";
import { cn } from "@/lib/utils";

import { clientSignup } from "@/utils/auth-client";

// Giảm độ trong suốt
const glassEffect =
	"bg-black/50 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl";

export default function RegisterPage() {
	// === State ===
	const [email, setEmail] = useState<string>("");
	const [username, setUsername] = useState<string>(""); // MỚI: Thêm state cho username
	const [password, setPassword] = useState<string>("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isSuccess, setIsSuccess] = useState<boolean>(false);

	const router = useRouter();

	// === Handlers ===
	const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		setIsSuccess(false);

		// Kiểm tra mật khẩu
		if (password !== confirmPassword) {
			setError("Mật khẩu không khớp.");
			return;
		}

		setIsLoading(true);

		const { error } = await clientSignup({ email, password, username });
		if (error) {
			setError(error);
			setIsLoading(false);
			return;
		}
		// Đăng ký thành công
		setIsSuccess(true);
		setIsLoading(false);
	};

	// Xử lý đăng nhập OAuth (Google)
	const handleOAuthLogin = async (_provider: "google" | "apple") => {
		// OAuth chưa được cấu hình cho backend tuỳ chỉnh
		setError("OAuth chưa được hỗ trợ trong phiên bản này");
	};

	return (
		<main
			className="h-screen w-screen text-white p-3 transition-all duration-500"
			style={{
				backgroundImage: `url(https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=2070&auto=format&fit=crop)`, // Hình nền sống động khác
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			{/* Container để căn giữa form */}
			<div className="relative w-full h-full flex items-center justify-center">
				{/* Bố cục 1 cột, max-w-md */}
				<div
					className={cn(
						"w-full max-w-md px-8 py-4 flex flex-col gap-4",
						glassEffect
					)}
				>
					{/* Header bên trong card */}
					<div className="flex justify-between items-center w-full">
						{/* Logo */}
						<div className="flex items-center gap-2">
							<Brain className="w-8 h-8 text-white" />
							<h1 className="text-2xl font-bold text-white">
								Optimind
							</h1>
						</div>
						{/* Nút quay lại */}
						<Button
							asChild
							variant="ghost"
							className="text-gray-300 hover:text-white"
						>
							<Link href="/">
								<ArrowLeft className="w-4 h-4 mr-2" />
								Về trang chủ
							</Link>
						</Button>
					</div>

					{/* Đường kẻ ngang */}
					<div className="h-px bg-white/20 w-full" />

					{/* === Form Đăng Ký === */}
					<div className="w-full flex flex-col justify-center">
						{/* THAY ĐỔI: Tiêu đề động */}
						<h1 className="text-3xl font-bold text-white mb-2 text-center">
							{isSuccess ? "Kiểm tra Email" : "Tạo tài khoản"}
						</h1>

						{/* THAY ĐỔI: Hiển thị form hoặc thông báo thành công */}
						{isSuccess ? (
							<div className="text-center text-gray-100 space-y-4">
								<MailCheck className="w-16 h-16 text-green-400 mx-auto" />
								<p>Đăng ký thành công!</p>
								<p className="text-gray-300">
									Chúng tôi đã gửi một liên kết xác nhận đến{" "}
									<strong className="text-white">
										{email}
									</strong>
									. Vui lòng kiểm tra email để hoàn tất.
								</p>
								<Button
									asChild
									className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700 mt-4"
								>
									<Link href="/login">
										Quay lại Đăng nhập
									</Link>
								</Button>
							</div>
						) : (
							// Form đăng ký
							<>
								<form
									className="space-y-3"
									onSubmit={handleRegister}
								>
									{/* Trường Email */}
									<div className="relative space-y-2">
										<Label
											htmlFor="email"
											className="text-white text-sm"
										>
											Email
										</Label>
										<Mail className="absolute left-3 top-9 h-5 w-5 text-gray-300" />
										<Input
											id="email"
											type="email"
											placeholder="vidu@optimind.vn"
											className="pl-10 text-base bg-white/10 border-white/20 placeholder:text-gray-300 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
											value={email}
											onChange={(e) =>
												setEmail(e.target.value)
											}
											required
										/>
									</div>

									{/* MỚI: Trường Tên người dùng */}
									<div className="relative space-y-2">
										<Label
											htmlFor="username"
											className="text-white text-sm"
										>
											Tên người dùng (Username)
										</Label>
										<User className="absolute left-3 top-9 h-5 w-5 text-gray-300" />
										<Input
											id="username"
											type="text"
											placeholder="optimind_user"
											className="pl-10 text-base bg-white/10 border-white/20 placeholder:text-gray-300 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
											value={username}
											onChange={(e) =>
												setUsername(e.target.value)
											}
											required
										/>
									</div>

									{/* Trường Mật khẩu */}
									<div className="relative space-y-2">
										<Label
											htmlFor="password"
											className="text-white text-sm"
										>
											Mật khẩu
										</Label>
										<Lock className="absolute left-3 top-9 h-5 w-5 text-gray-300" />
										<Input
											id="password"
											type="password"
											placeholder="Tối thiểu 6 ký tự"
											className="pl-10 text-base bg-white/10 border-white/20 placeholder:text-gray-300 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
											value={password}
											onChange={(e) =>
												setPassword(e.target.value)
											}
											required
										/>
									</div>

									{/* MỚI: Trường Xác nhận Mật khẩu */}
									<div className="relative space-y-2">
										<Label
											htmlFor="confirm-password"
											className="text-white text-sm"
										>
											Xác nhận mật khẩu
										</Label>
										<Lock className="absolute left-3 top-9 h-5 w-5 text-gray-300" />
										<Input
											id="confirm-password"
											type="password"
											placeholder="Nhập lại mật khẩu"
											className="pl-10 text-base bg-white/10 border-white/20 placeholder:text-gray-300 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
											value={confirmPassword}
											onChange={(e) =>
												setConfirmPassword(
													e.target.value
												)
											}
											required
										/>
									</div>

									{/* Hiển thị lỗi */}
									{error && (
										<p className="text-red-400 text-sm text-center">
											{error}
										</p>
									)}

									{/* Link Đăng nhập */}
									<div className="text-center text-gray-100 pt-2">
										Đã có tài khoản?{" "}
										<Link
											href="/login"
											className="font-semibold text-blue-400 hover:underline"
										>
											Đăng nhập
										</Link>
									</div>

									{/* Nút Đăng ký */}
									<Button
										type="submit"
										className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700"
										disabled={isLoading}
									>
										{isLoading
											? "Đang xử lý..."
											: "Tạo tài khoản"}
									</Button>
								</form>

								{/* "Or register with" Separator */}
								<div className="flex items-center gap-4 my-4">
									<div className="flex-grow h-px bg-white/20"></div>
									<span className="text-gray-200 text-sm">
										Hoặc đăng ký với
									</span>
									<div className="flex-grow h-px bg-white/20"></div>
								</div>

								{/* Social Logins */}
								<div className="flex flex-col gap-4">
									<Button
										variant="outline"
										className="w-full text-base h-11 bg-white hover:bg-gray-200 text-gray-800"
										onClick={() =>
											handleOAuthLogin("google")
										}
										disabled={isLoading}
									>
										<Chrome className="w-5 h-5 mr-2" />{" "}
										Google
									</Button>
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
