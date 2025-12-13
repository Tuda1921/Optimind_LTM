"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Brain, Mail, Lock, Chrome, Apple, ArrowLeft } from "lucide-react"; // Thêm icon
import { cn } from "@/lib/utils";
import { clientLogin } from "@/utils/auth-client";

// Giảm độ trong suốt
const glassEffect =
	"bg-black/50 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl";

export default function LoginPage() {
	// === State ===
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(false);

	const router = useRouter();

	const handleLogin = async () => {
		setLoading(true);
		setError(null);
		const { user, error: loginError } = await clientLogin({ email, password });
		if (loginError || !user) {
			setError(loginError || "Đăng nhập thất bại");
			setLoading(false);
		} else {
			router.push("/study");
			router.refresh();
		}
	};

	return (
		<main
			className="h-screen w-screen text-white p-6 transition-all duration-500"
			style={{
				backgroundImage: `url(https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop)`, // Hình nền sống động
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			{/* Container để căn giữa form */}
			<div className="relative w-full h-full flex items-center justify-center">
				{/* === THAY ĐỔI: Bố cục 1 cột, max-w-md === */}
				<div
					className={cn(
						"w-full max-w-md p-8 flex flex-col gap-4", // THAY ĐỔI: gap-6 -> gap-4
						glassEffect // Áp dụng hiệu ứng
					)}
				>
					{/* === MỚI: Header bên trong card === */}
					<div className="flex justify-between items-center w-full">
						{/* Logo */}
						<div className="flex items-center gap-2">
							{/* THAY ĐỔI: Thêm màu gradient cho icon */}
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

					{/* === CỘT PHẢI (Form đăng nhập) === */}
					<div className="w-full flex flex-col justify-center">
						{/* THAY ĐỔI: Tiêu đề căn giữa */}
						<h1 className="text-3xl font-bold text-white mb-4 text-center">
							{" "}
							{/* THAY ĐỔI: mb-6 -> mb-4 */}
							Chào mừng trở lại!
						</h1>

						{/* Form */}
						<form className="space-y-3">
							{" "}
							{/* THAY ĐỔI: space-y-4 -> space-y-3 */}
							{/* Trường Email */}
							<div className="relative space-y-2">
								<Label
									htmlFor="email"
									className="text-white text-sm"
								>
									{" "}
									{/* THAY ĐỔI: text-white */}
									Email
								</Label>
								{/* THAY ĐỔI: Chỉnh vị trí icon top-9 (36px) cho vừa input h-10 */}
								<Mail className="absolute left-3 top-9 h-5 w-5 text-gray-300" />
								<Input
									id="email"
									type="email"
									placeholder="vidu@optimind.vn"
									// THAY ĐỔI: Bỏ h-12, text-lg. Đổi pl-12 -> pl-10
									className="pl-10 text-base bg-white/10 border-white/20 placeholder:text-gray-300 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
							</div>
							{/* Trường Mật khẩu */}
							<div className="relative space-y-2">
								<div className="flex justify-between items-center">
									<Label
										htmlFor="password"
										className="text-white text-sm"
									>
										{" "}
										{/* THAY ĐỔI: text-white */}
										Mật khẩu
									</Label>
									<Link
										href="/forgot-password"
										className="text-sm text-blue-400 hover:underline" // THAY ĐỔI: text-blue-400
									>
										Quên mật khẩu?
									</Link>
								</div>
								{/* THAY ĐỔI: Chỉnh vị trí icon top-9 (36px) */}
								<Lock className="absolute left-3 top-9 h-5 w-5 text-gray-300" />
								<Input
									id="password"
									type="password"
									placeholder="••••••••"
									// THAY ĐỔI: Bỏ h-12, text-lg. Đổi pl-12 -> pl-10
									className="pl-10 text-base bg-white/10 border-white/20 placeholder:text-gray-300 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									required
								/>
							</div>
							{/* Hiển thị thông báo lỗi */}
							{error && (
								<p className="text-red-400 text-sm text-center">
									{error}
								</p> // THAY ĐỔI: text-red-400
							)}
							{/* THAY ĐỔI: Chuyển link đăng ký lên trên */}
							<div className="text-center text-gray-100 pt-2">
								{" "}
								{/* THAY ĐỔI: text-gray-100, pt-2 */}
								Chưa có tài khoản?{" "}
								<Link
									href="/register"
									className="font-semibold text-blue-400 hover:underline" // THAY ĐỔI: text-blue-400
								>
									Đăng ký
								</Link>
							</div>
							{/* Nút Đăng nhập */}
							<Button
								type="button"
								className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700"
								disabled={loading}
								onClick={handleLogin}
							>
								{loading ? "Đang đăng nhập..." : "Đăng nhập"}
							</Button>
						</form>

						{/* "Or register with" Separator */}
						<div className="flex items-center gap-4 my-4">
							{" "}
							{/* THAY ĐỔI: my-6 -> my-4 */}
							<div className="flex-grow h-px bg-white/20"></div>
							<span className="text-gray-200 text-sm">
								Hoặc đăng nhập với
							</span>{" "}
							{/* THAY ĐỔI: text-gray-200 */}
							<div className="flex-grow h-px bg-white/20"></div>
						</div>

						{/* Social Logins */}
						{/* THAY ĐỔI: Chỉ còn Google và đổi màu */}
						<div className="flex flex-col gap-4">
							<Button
								variant="outline"
								// THAY ĐỔS: Nền trắng, chữ đen
								className="w-full text-base h-11 bg-white hover:bg-gray-200 text-gray-800" // THAY ĐỔI: h-11
								onClick={() => {}}
								// disabled={loading}
							>
								<Chrome className="w-5 h-5 mr-2" /> Google
							</Button>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
