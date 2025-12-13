// Tên file: app/page.tsx
"use client";

import { useState, useEffect, useRef, FC } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"; // Cho FAQ
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel"; // Cho Nhận xét
import {
	Brain, // Icon chính
	LogIn, // Icon Đăng nhập
	UserPlus, // Icon Đăng ký
	Facebook,
	Twitter,
	Instagram,
	Timer, // Icon cho Section 2
	Star,
	CheckSquare,
	ChevronRight, // Icon cho "Learn More"
	Play,
	Pause,
	Camera,
	BarChart3,
	PieChart, // Icon cho Hướng dẫn
	RefreshCcw, // Icon cho Restart
	History, // MỚI: Cho Lịch sử
	LogOut,
	Users, // MỚI: Cho Đăng xuất
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { User } from "@/utils/types";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { clientGetCurrentUser, clientLogout } from "@/utils/auth-client";

// --- Hàm tiện ích ---
const whiteBox = "bg-white rounded-2xl shadow-xl";
const lightBox = "bg-gray-50 rounded-2xl shadow-lg";

// Hàm định dạng thời gian
const formatTime = (seconds: number): string => {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

// --- Class cho hiệu ứng linear Mask ---
const maskClass =
	"[mask-image:linear-linear(to_bottom,transparent_0%,black_5%,black_95%,transparent_100%)]";


// --- Component Chính: Landing Page (Theo phong cách Calm.com) ---
export default function LandingPage() {
	// --- State Ảnh Nền ---
	const [backgroundHeroUrl] = useState<string>(
		"https://i.pinimg.com/1200x/9e/23/f0/9e23f0e8bacb5f03ad6418a3bdd1727b.jpg"
	);
	const [backgroundDemoUrl] = useState<string>(
		"https://i.pinimg.com/1200x/02/12/9c/02129c9f9ee35d9ddae567afd49d27b8.jpg"
	);
	const [backgroundPricingUrl] = useState<string>(
		"https://i.pinimg.com/736x/a6/00/2c/a6002c180d0f925d224aa72d7a1ff8cd.jpg"
	);
	const [backgroundGuideUrl] = useState<string>(
		"https://i.pinimg.com/736x/4f/bf/bd/4fbfbdabd294d91e676770037bd70322.jpg"
	);
	const [backgroundFooterUrl] = useState<string>(
		"https://i.pinimg.com/736x/30/e7/cb/30e7cb6ab85a69c8e57e9e591e73b776.jpg"
	);

	// --- State cho Demo ---
	const [timeLeft, setTimeLeft] = useState<number>(5 * 60); // 5 phút
	const [isDemoRunning, setDemoRunning] = useState<boolean>(false);
	const [demoFocus, setDemoFocus] = useState<number>(0); // Điểm tập trung giả

	// --- State cho hiệu ứng Header & Auth ---
	const [isScrolled, setIsScrolled] = useState<boolean>(false);
	const [user, setUser] = useState<User | null>(null); // MỚI: State người dùng
	const [loading, setLoading] = useState<boolean>(true); // MỚI: State tải

	const router = useRouter();

	// --- Effect cho Header (Scroll) ---
	useEffect(() => {
		const handleScroll = (): void => {
			if (window.scrollY > 10) {
				setIsScrolled(true);
			} else {
				setIsScrolled(false);
			}
		};
		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []); // Chỉ chạy 1 lần

	// Auth: Lấy user hiện tại từ API
	useEffect(() => {
		const run = async () => {
			const u = await clientGetCurrentUser();
			setUser(u);
			setLoading(false);
		};
		run();
	}, []);

	// --- Effect cho Demo Timer ---
	useEffect(() => {
		if (!isDemoRunning || timeLeft === 0) {
			if (timeLeft === 0) setDemoRunning(false); // Tự dừng khi hết giờ
			return;
		}
		let timerInterval: NodeJS.Timeout | null = null;
		let focusInterval: NodeJS.Timeout | null = null;
		if (isDemoRunning && timeLeft > 0) {
			timerInterval = setInterval(() => {
				setTimeLeft((prev) => prev - 1);
			}, 1000);
			focusInterval = setInterval(() => {
				setDemoFocus(Math.floor(Math.random() * 21) + 80); // Giả lập 80-100%
			}, 2000);
		}
		return () => {
			if (timerInterval) clearInterval(timerInterval);
			if (focusInterval) clearInterval(focusInterval);
		};
	}, [isDemoRunning, timeLeft]);

	const handleDemoToggle = (): void => {
		if (timeLeft === 0) setTimeLeft(5 * 60); // Reset nếu hết giờ
		setDemoRunning(!isDemoRunning);
	};

	const handleDemoReset = (): void => {
		setDemoRunning(false);
		setTimeLeft(5 * 60);
		setDemoFocus(0);
	};

	// MỚI: Hàm Đăng xuất
	const handleLogout = async () => {
		await clientLogout();
		setUser(null);
		router.refresh();
	};

	return (
		// === Main container ===
		<main className="w-screen text-gray-700 bg-white">
			{/* === HEADER CỐ ĐỊNH (Theo style Calm) === */}
			<header
				className={cn(
					"fixed top-0 z-50 flex w-full items-center justify-between p-4",
					"transition-colors duration-300 ease-in-out",
					isScrolled
						? "bg-white shadow-md text-blue-800"
						: "bg-linear-to-b from-black/50 to-transparent text-white"
				)}
			>
				<div className="flex items-center gap-6 max-w-7xl mx-auto w-full">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-2">
						<Brain
							className={cn(
								"h-8 w-8 transition-colors",
								isScrolled ? "text-blue-500" : "text-white"
							)}
						/>
						<span
							className={cn(
								"text-2xl font-bold transition-colors",
								isScrolled ? "text-blue-800" : "text-white"
							)}
						>
							Optimind
						</span>
					</Link>

					{/* Navigation Links (Giống Calm) */}
					<nav className="hidden md:flex gap-6">
						<Link
							href="#features"
							className={cn(
								"font-medium transition-colors",
								isScrolled
									? "text-blue-800 hover:text-blue-600"
									: "text-white hover:text-white/80"
							)}
						>
							Tính năng
						</Link>
						<Link
							href="#reviews"
							className={cn(
								"font-medium transition-colors",
								isScrolled
									? "text-blue-800 hover:text-blue-600"
									: "text-white hover:text-white/80"
							)}
						>
							Nhận xét
						</Link>
						<Link
							href="#faq"
							className={cn(
								"font-medium transition-colors",
								isScrolled
									? "text-blue-800 hover:text-blue-600"
									: "text-white hover:text-white/80"
							)}
						>
							FAQ
						</Link>
					</nav>

					{/* === Nút Đăng nhập / Đăng ký (THAY ĐỔI) === */}
					<div className="flex gap-2 ml-auto">
						{/* Trạng thái đang tải */}
						{loading && (
							<div className="flex gap-2">
								<div className="h-10 w-24 rounded-full bg-gray-500/30 animate-pulse" />
								<div className="h-10 w-36 rounded-full bg-gray-500/30 animate-pulse" />
							</div>
						)}

						{/* Trạng thái Chưa Đăng Nhập */}
						{!loading && !user && (
							<>
								<Button
									asChild
									variant="ghost"
									className={cn(
										"transition-colors text-base rounded-full",
										isScrolled
											? "text-blue-800 hover:bg-gray-100"
											: "text-white hover:bg-white/20"
									)}
								>
									<Link href="/login">
										<LogIn className="mr-2 h-4 w-4" />
										Đăng nhập
									</Link>
								</Button>
								<Button
									asChild
									className={cn(
										"text-base rounded-full",
										isScrolled
											? "bg-blue-600 hover:bg-blue-700 text-white"
											: "bg-white hover:bg-gray-200 text-blue-600"
									)}
								>
									<Link href="/register">
										Dùng thử Miễn phí
									</Link>
								</Button>
							</>
						)}

						{/* MỚI: Trạng thái Đã Đăng Nhập */}
						{!loading && user && (
							<>
								<Button
									asChild
									variant="ghost"
									className={cn(
										"transition-colors text-base rounded-full",
										isScrolled
											? "text-blue-800 hover:bg-gray-100"
											: "text-white hover:bg-white/20"
									)}
								>
									<Link href="/history">
										{" "}
										{/* Cần tạo trang /history */}
										<History className="mr-2 h-4 w-4" />
										Lịch sử học tập
									</Link>
								</Button>
								<Button
									asChild
									className={cn(
										"text-base rounded-full text-white",
										"bg-linear-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
									)}
								>
									<Link href="/study">
										{" "}
										{/* Cần tạo trang /study */}
										<Play className="mr-2 h-4 w-4" />
										Bắt đầu học
									</Link>
								</Button>
								<Button
									variant="ghost"
									onClick={handleLogout}
									className={cn(
										"transition-colors text-base rounded-full",
										isScrolled
											? "text-blue-800 hover:bg-gray-100"
											: "text-white hover:bg-white/20"
									)}
								>
									<LogOut className="mr-2 h-4 w-4" />
									Đăng xuất
								</Button>
							</>
						)}
					</div>
				</div>
			</header>

			{/* === PHẦN 1: HERO === */}
			<section
				className={cn(
					"w-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden",
					"h-[550px] max-h-[600px]"
				)}
			>
				<img
					src={backgroundHeroUrl}
					alt="Optimind Hero Background"
					className="absolute inset-0 w-full h-full object-cover z-0"
				/>
				<div className="relative z-10 w-full max-w-3xl animate-fade-in-up p-8">
					<h1
						className="text-6xl font-extrabold leading-tight text-white"
						style={{ textShadow: "0 4px 15px rgba(0,0,0,0.5)" }}
					>
						Tối ưu tâm trí. Thay đổi cuộc đời.
					</h1>
					<p
						className="mt-6 text-xl text-gray-100 max-w-2xl mx-auto"
						style={{ textShadow: "0 2px 5px rgba(0,0,0,0.3)" }}
					>
						Quản lý căng thẳng, học tập tốt hơn và cảm thấy hiện
						diện hơn trong cuộc sống.
					</p>
					<div className="mt-8 flex gap-4 justify-center">
						<Button
							asChild
							size="lg"
							className="bg-linear-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-lg h-14 px-8 rounded-full text-white"
						>
							<Link href="/register">
								Dùng thử Optimind Miễn phí
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* === PHẦN 2: HỖ TRỢ === */}
			<section
				id="features"
				className="h-auto w-screen flex flex-col items-center justify-center p-8 py-24 bg-white"
			>
				<h2 className="text-5xl font-bold mb-4 text-center text-blue-800">
					Optimind giúp bạn học tốt hơn.
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto mt-16">
					{/* Cột 1: Tập trung */}
					<div className="flex flex-col items-center text-center animate-fade-in-up">
						<Brain className="w-12 h-12 text-blue-500" />
						<h3 className="text-3xl font-semibold my-4 text-blue-800">
							Tập trung hơn
						</h3>
						<p className="text-lg text-gray-700">
							Các công cụ AI giám sát và phân tích giúp bạn nhận
							diện và cải thiện sự tập trung.
						</p>
						<Button
							variant="link"
							className="text-lg text-blue-700 p-0 mt-2"
						>
							Learn More <ChevronRight className="w-4 h-4 ml-1" />
						</Button>
					</div>
					{/* Cột 2: Hiệu quả */}
					<div
						className="flex flex-col items-center text-center animate-fade-in-up"
						style={{ animationDelay: "0.2s" }}
					>
						<Timer className="w-12 h-12 text-green-500" />
						<h3 className="text-3xl font-semibold my-4 text-blue-800">
							Học hiệu quả
						</h3>
						<p className="text-lg text-gray-700">
							Quản lý thời gian với Pomodoro, lập kế hoạch và theo
							dõi nhiệm vụ (task) trực quan.
						</p>
						<Button
							variant="link"
							className="text-lg text-blue-700 p-0 mt-2"
						>
							Learn More <ChevronRight className="w-4 h-4 ml-1" />
						</Button>
					</div>
					{/* Cột 3: Động lực */}
					<div
						className="flex flex-col items-center text-center animate-fade-in-up"
						style={{ animationDelay: "0.4s" }}
					>
						<Star className="w-12 h-12 text-yellow-500" />
						<h3 className="text-3xl font-semibold my-4 text-blue-800">
							Luôn có động lực
						</h3>
						<p className="text-lg text-gray-700">
							Nhận thưởng, nuôi pet, và thi đấu với bạn bè. Học
							tập chưa bao giờ vui đến thế.
						</p>
						<Button
							variant="link"
							className="text-lg text-blue-700 p-0 mt-2"
						>
							Learn More <ChevronRight className="w-4 h-4 ml-1" />
						</Button>
					</div>
				</div>
			</section>

			{/* === PHẦN 3: DEMO === */}
			<section
				className={cn(
					"relative w-screen flex flex-col items-center justify-center p-8 overflow-hidden",
					"py-10"
				)}
			>
				{/* Ảnh nền */}
				<img
					src={backgroundDemoUrl}
					alt="Demo background"
					className={cn(
						"absolute inset-0 w-full h-full object-cover z-0 opacity-80",
						maskClass
					)}
				/>

				{/* Tiêu đề */}
				<div className="relative z-10 w-full max-w-4xl text-center mb-8">
					<h2
						className="text-5xl font-bold mb-4 text-white"
						style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
					>
						Dùng thử ngay!
					</h2>
					<p
						className="text-lg text-gray-100"
						style={{ textShadow: "0 1px 5px rgba(0,0,0,0.5)" }}
					>
						Trải nghiệm tính năng cốt lõi trong 5 phút
					</p>
				</div>

				{/* Container cho nội dung Demo */}
				<div
					className={cn(
						"w-full max-w-4xl rounded-2xl shadow-2xl", // Tăng max-w
						"relative z-10",
						"bg-white/80 backdrop-blur-sm overflow-hidden" // Hiệu ứng kính mờ
					)}
				>
					<div className={cn("w-full p-8")}>
						<div className="flex flex-col md:flex-row gap-8">
							{/* Cột 1: Timer + Chart */}
							<div className="flex-1 flex flex-col items-center justify-center gap-4">
								{/* Timer & Buttons */}
								<div className="w-full flex-1 flex flex-col items-center justify-center p-6 bg-gray-100/80 rounded-lg shadow-inner">
									<h3 className="text-2xl font-semibold mb-4 text-blue-800">
										Bộ đếm Pomodoro
									</h3>
									{/* Timer và Nút bấm */}
									<div className="flex items-center justify-center gap-4">
										<div className="text-6xl font-bold text-blue-800">
											{" "}
											{formatTime(timeLeft)}
										</div>
										<div className="flex flex-col gap-2">
											{" "}
											<Button
												onClick={handleDemoToggle}
												size="icon"
												className="rounded-full"
											>
												{isDemoRunning ? (
													<Pause className="h-5 w-5" />
												) : (
													<Play className="h-5 w-5" />
												)}
											</Button>
											{/* NÚT MỚI: Restart */}
											<Button
												onClick={handleDemoReset}
												size="icon"
												variant="outline"
												className="rounded-full"
											>
												<RefreshCcw className="h-5 w-5" />
											</Button>
										</div>
									</div>
								</div>

								{/* Chart (BÊN DƯỚI) */}
								<div className="h-32 w-full bg-gray-100/80 rounded-lg p-4 shadow-inner">
									<h4 className="font-semibold flex items-center gap-2 text-blue-800">
										<BarChart3 className="w-5 h-5" /> Biểu
										đồ tập trung
									</h4>
									<div className="flex items-end h-20 gap-1">
										<span className="text-3xl font-bold text-green-600">
											{isDemoRunning
												? `${demoFocus}%`
												: "--%"}
										</span>
									</div>
								</div>
							</div>

							{/* Cột 2: Camera (BÊN PHẢI) */}
							<div className="flex-1">
								<div className="w-full aspect-video bg-gray-800 text-white rounded-lg flex flex-col items-center justify-center">
									<Camera className="h-16 w-16 text-gray-500" />
									<p className="text-gray-300">
										Bật camera để theo dõi
									</p>
									<p className="text-sm text-gray-400">
										(Đang chờ:{" "}
										{isDemoRunning ? "ON" : "OFF"})
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* === PHẦN 4: TÍNH NĂNG (Trước là 3) === */}
			<section className="h-auto w-screen flex flex-col items-center justify-center p-8 py-24 bg-white">
				<h2 className="text-5xl font-bold mb-16 text-center text-blue-800">
					Tính năng vượt trội
				</h2>
				<div className="flex flex-col gap-16 max-w-7xl">
					{/* Tính năng 1: Đo lường (Ảnh trái) */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
						<div className="animate-fade-in-up">
							<img
								src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format=fit=crop" // Ảnh người đang viết
								alt="Đo lường tập trung"
								className={cn(
									"rounded-2xl shadow-xl w-full object-cover",
									"h-[450px]"
								)}
							/>
						</div>
						<div
							className="animate-fade-in-up"
							style={{ animationDelay: "0.2s" }}
						>
							<Brain className="h-12 w-12 text-blue-500 mb-4" />
							<h3 className="text-4xl font-semibold mb-4 text-blue-800">
								Đo lường tập trung
							</h3>
							<p className="text-lg text-gray-700">
								Sử dụng A.I qua camera để phân tích và cảnh báo
								khi bạn mất tập trung. Hệ thống sẽ đưa ra biểu
								đồ chi tiết sau mỗi phiên học giúp bạn hiểu rõ
								bản thân.
							</p>
						</div>
					</div>

					{/* Tính năng 2: Gamification (Ảnh phải) */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
						<div className="md:order-last animate-fade-in-up">
							<img
								src="https://images.unsplash.com/photo-1599481238640-4c1278592A6a?q=80&w=800&auto=format=fit=crop" // Ảnh mèo
								alt="Gamification"
								className={cn(
									"rounded-2xl shadow-xl w-full object-cover",
									"h-[450px]"
								)}
							/>
						</div>
						<div
							className="animate-fade-in-up"
							style={{ animationDelay: "0.2s" }}
						>
							<Star className="h-12 w-12 text-yellow-500 mb-4" />
							<h3 className="text-4xl font-semibold mb-4 text-blue-800">
								Gamification & Pet
							</h3>
							<p className="text-lg text-gray-700">
								Biến thời gian học thành điểm thưởng. Dùng điểm
								để nuôi pet ảo, mua vật phẩm, mở khóa các loài
								vật hiếm và đua top bảng xếp hạng.
							</p>
						</div>
					</div>

					{/* Tính năng 3: Phòng học (Ảnh trái) */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
						<div className="animate-fade-in-up">
							<img
								src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format=fit=crop"
								alt="Phòng học nhóm"
								className={cn(
									"rounded-2xl shadow-xl w-full object-cover",
									"h-[450px]"
								)}
							/>
						</div>
						<div
							className="animate-fade-in-up"
							style={{ animationDelay: "0.2s" }}
						>
							<Users className="h-12 w-12 text-green-500 mb-4" />
							<h3 className="text-4xl font-semibold mb-4 text-blue-800">
								Phòng học & Thi đấu
							</h3>
							<p className="text-lg text-gray-700">
								Học không đơn độc. Tham gia phòng học chung để
								có không khí, hoặc thách đấu 1v1 với bạn bè để
								xem ai là "vua tập trung".
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* === PHẦN 5: NHẬN XÉT (Trước là 4) === */}
			<section
				id="reviews"
				className="h-auto w-screen flex flex-col items-center justify-center p-8 py-24 bg-blue-600 text-white overflow-hidden"
			>
				<style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
				<h2 className="text-5xl font-bold mb-12">
					Họ nói gì về Optimind?
				</h2>
				<div className="w-full max-w-7xl flex overflow-x-auto gap-8 scroll-snap-type-x-mandatory no-scrollbar pb-4">
					<div
						className={cn(
							"p-8 bg-white/10 rounded-2xl border border-white/20",
							"w-[90%] md:w-[400px] shrink-0 scroll-snap-align-start"
						)}
					>
						<div className="flex items-center gap-4 mb-4">
							<Avatar>
								<AvatarImage src="/avatars/01.png" />
								<AvatarFallback>MA</AvatarFallback>
							</Avatar>
							<div>
								<h4 className="font-semibold">Minh Anh</h4>
								<p className="text-sm text-gray-300">
									Sinh viên ĐH Bách Khoa
								</p>
							</div>
						</div>
						<p className="text-lg text-gray-100 italic">
							"Trước đây mình rất hay trì hoãn, đặc biệt là khi
							phải làm dự án lớn. Từ khi dùng Optimind, mình không
							còn trì hoãn nữa. Tính năng nuôi pet thực sự rất
							cuốn! Việc thấy pet của mình lớn lên mỗi khi học
							xong làm mình có động lực hơn hẳn."
						</p>
					</div>
					<div
						className={cn(
							"p-8 bg-white/10 rounded-2xl border border-white/20",
							"w-[90%] md:w-[400px] shrink-0 scroll-snap-align-start"
						)}
					>
						<div className="flex items-center gap-4 mb-4">
							<Avatar>
								<AvatarImage src="/avatars/02.png" />
								<AvatarFallback>TT</AvatarFallback>
							</Avatar>
							<div>
								<h4 className="font-semibold">Thanh Tùng</h4>
								<p className="text-sm text-gray-300">
									Học sinh lớp 12
								</p>
							</div>
						</div>
						<p className="text-lg text-gray-100 italic">
							"Phòng thi đấu 1v1 là tính năng mình thích nhất.
							Mình và bạn hay thi với nhau xem ai tập trung hơn để
							giành hạng. Nó biến việc học căng thẳng thành một
							trò chơi có tính cạnh tranh, rất vui."
						</p>
					</div>
					<div
						className={cn(
							"p-8 bg-white/10 rounded-2xl border border-white/20",
							"w-[90%] md:w-[400px] shrink-0 scroll-snap-align-start"
						)}
					>
						<div className="flex items-center gap-4 mb-4">
							<Avatar>
								<AvatarImage src="/avatars/03.png" />
								<AvatarFallback>NL</AvatarFallback>
							</Avatar>
							<div>
								<h4 className="font-semibold">Ngọc Lan</h4>
								<p className="text-sm text-gray-300">
									Freelancer
								</p>
							</div>
						</div>
						<p className="text-lg text-gray-100 italic">
							"Là một freelancer, mình cần tự giác rất cao. Biểu
							đồ phân tích của Optimind thật sự hữu ích. Nó giúp
							mình nhận ra mình hay mất tập trung vào khung giờ
							nào để sắp xếp công việc hợp lý hơn."
						</p>
					</div>
					<div
						className={cn(
							"p-8 bg-white/10 rounded-2xl border border-white/20",
							"w-[90%] md:w-[400px] shrink-0 scroll-snap-align-start"
						)}
					>
						<div className="flex items-center gap-4 mb-4">
							<Avatar>
								<AvatarImage src="/avatars/04.png" />
								<AvatarFallback>HP</AvatarFallback>
							</Avatar>
							<div>
								<h4 className="font-semibold">Hoàng Phúc</h4>
								<p className="text-sm text-gray-300">
									Sinh viên Y khoa
								</p>
							</div>
						</div>
						<p className="text-lg text-gray-100 italic">
							"Khối lượng kiến thức ngành y rất lớn. Tính năng
							'Task' kết hợp với Pomodoro giúp mình chia nhỏ các
							mục tiêu. Khi hoàn thành một task, mình cảm thấy rất
							thỏa mãn. Rất khuyến khích!"
						</p>
					</div>
				</div>
			</section>

			{/* === PHẦN 6: VỀ CHÚNG TÔI (Trước là 5) === */}
			<section className="h-auto w-screen flex flex-col items-center justify-center p-8 py-24 bg-white">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-7xl">
					<div className="animate-fade-in-up">
						<img
							src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format=fit=crop"
							alt="Đội ngũ Optimind"
							className={cn(
								"rounded-2xl shadow-xl w-full object-cover",
								"h-[450px]"
							)}
						/>
					</div>
					<div
						className="animate-fade-in-up"
						style={{ animationDelay: "0.2s" }}
					>
						<h2 className="text-4xl font-semibold mb-4 text-blue-800">
							Câu chuyện của chúng tôi
						</h2>
						<p className="text-lg text-gray-700 mb-6">
							Optimind được sáng lập bởi một nhóm sinh viên nhận
							thấy chính bản thân họ và bạn bè xung quanh đang vật
							lộn với sự mất tập trung trong thời đại số. Chúng
							tôi tin rằng công nghệ không nên là kẻ thù của sự
							tập trung, mà nên là đồng minh.
						</p>
						<h3 className="text-3xl font-semibold mb-4 text-blue-800">
							Sứ mệnh
						</h3>
						<p className="text-lg text-gray-700">
							Sứ mệnh của Optimind là cung cấp các công cụ A.I.
							mạnh mẽ và cơ chế "gamification" hấp dẫn để biến
							việc học tập, làm việc trở nên hiệu quả và thú vị
							hơn.
						</p>
					</div>
				</div>
			</section>

			{/* === PHẦN 7: FAQ (Trước là 6) === */}
			<section
				id="faq"
				className="h-auto w-screen flex flex-col items-center justify-center p-8 py-24 bg-gray-100"
			>
				<h2 className="text-5xl font-bold mb-12 text-blue-800">
					Câu hỏi thường gặp
				</h2>
				<div className={cn("w-full max-w-3xl p-6", whiteBox)}>
					<h4 className="text-xl font-semibold mb-4 text-blue-600">
						Phương pháp đo
					</h4>
					<Accordion type="single" collapsible className="w-full">
						<AccordionItem value="item-1">
							<AccordionTrigger className="text-lg text-blue-800 text-left">
								Optimind đo độ tập trung như thế nào?
							</AccordionTrigger>
							<AccordionContent className="text-base text-gray-700">
								Chúng tôi sử dụng thuật toán A.I nâng cao để
								phân tích hình ảnh từ camera của bạn. Hệ thống
								sẽ phát hiện các dấu hiệu như ngáp, nhìn đi chỗ
								khác, hoặc rời khỏi vị trí và ghi nhận lại.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-2">
							<AccordionTrigger className="text-lg text-blue-800 text-left">
								Dữ liệu camera của tôi có an toàn không?
							</AccordionTrigger>
							<AccordionContent className="text-base text-gray-700">
								Tuyệt đối. Toàn bộ quá trình xử lý diễn ra ngay
								trên trình duyệt của bạn. Hình ảnh của bạn không
								bao giờ được gửi lên máy chủ của chúng tôi, đảm
								bảo 100% riêng tư.
							</AccordionContent>
						</AccordionItem>
					</Accordion>
					<h4 className="text-xl font-semibold mb-4 mt-8 text-blue-600">
						Gamification & Tính năng
					</h4>
					<Accordion type="single" collapsible className="w-full">
						<AccordionItem value="item-3">
							<AccordionTrigger className="text-lg text-blue-800 text-left">
								Điểm thưởng (Points) dùng để làm gì?
							</AccordionTrigger>
							<AccordionContent className="text-base text-gray-700">
								Bạn nhận được điểm thưởng khi hoàn thành các
								phiên học và duy trì độ tập trung cao. Bạn có
								thể dùng điểm này trong Cửa hàng (Shop) để mua
								thức ăn, vật phẩm cho pet, hoặc trang trí hồ sơ
								của mình.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-4">
							<AccordionTrigger className="text-lg text-blue-800 text-left">
								Làm thế nào để quản lý Task (Nhiệm vụ)?
							</AccordionTrigger>
							<AccordionContent className="text-base text-gray-700">
								Bạn có thể vào mục "Kế hoạch" (biểu tượng lịch)
								để tạo các danh sách To-do. Khi bắt đầu một
								phiên học (Pomodoro), bạn có thể chọn một nhiệm
								vụ cụ thể để theo dõi, giúp bạn tập trung vào
								đúng mục tiêu.
							</AccordionContent>
						</AccordionItem>
					</Accordion>
					<h4 className="text-xl font-semibold mb-4 mt-8 text-blue-600">
						Tài khoản
					</h4>
					<Accordion type="single" collapsible className="w-full">
						<AccordionItem value="item-5">
							<AccordionTrigger className="text-lg text-blue-800 text-left">
								Optimind có miễn phí không?
							</AccordionTrigger>
							<AccordionContent className="text-base text-gray-700">
								Optimind cung cấp gói miễn phí (Free) với các
								tính năng cơ bản như Pomodoro và quản lý task.
								Để sử dụng các tính năng nâng cao như A.I. đo độ
								tập trung, phòng thi đấu, và hệ thống pet, bạn
								cần nâng cấp lên gói Pro.
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</section>

			{/* === PHẦN 8: HƯỚNG DẪN SỬ DỤNG === */}
			<section
				className={cn(
					"h-auto w-screen flex flex-col items-center justify-center p-8 py-24 relative overflow-hidden"
				)}
			>
				{/* Ảnh nền họa tiết */}
				<img
					src={backgroundGuideUrl}
					alt="Waves background"
					className={cn(
						"absolute inset-0 w-full h-full object-cover z-0 opacity-40 blur-sm"
					)}
				/>
				<div className="relative z-10 text-center mb-12 p-6">
					<h2
						className="text-5xl font-bold mb-8 text-blue-800"
						style={{
							textShadow: "0 2px 10px rgba(255,255,255,0.3)",
						}}
					>
						Cách Optimind hoạt động
					</h2>
					<p
						className="text-xl text-gray-700 max-w-3xl mx-auto"
						style={{
							textShadow: "0 1px 5px rgba(255,255,255,0.2)",
						}}
					>
						Chúng tôi đã thiết kế một flow 4 bước đơn giản để giúp
						bạn xây dựng thói quen và tối ưu hiệu suất.
					</p>
				</div>

				{/* Hướng dẫn chi tiết 4 bước - BỐ CỤC XEN KẼ MỚI */}
				<div className="relative z-10 w-full max-w-6xl mx-auto">
					{/* Đường timeline (ẩn trên mobile) */}
					<div className="hidden md:block absolute left-1/2 top-10 bottom-10 w-1 bg-gray-200 -translate-x-1/2" />

					<div className="relative flex flex-col items-center gap-4">
						{/* Bước 1 (Trái) */}
						<div className="w-full md:w-1/2 md:pr-12 flex gap-6 items-center">
							<div
								className={cn(
									"p-6 text-left",
									whiteBox,
									"flex-1"
								)}
							>
								<h4 className="text-2xl font-semibold mt-2 mb-2 text-blue-800">
									Lập Kế Hoạch
								</h4>
								<p className="text-gray-700">
									Vào mục 'Kế hoạch' để tạo danh sách nhiệm vụ
									(tasks) và sắp xếp lịch học/làm việc của
									bạn.
								</p>
							</div>
							<div className="hidden md:flex items-center justify-center w-20 h-20 bg-blue-500 text-white rounded-full shrink-0 shadow-lg">
								<CheckSquare className="w-10 h-10" />
							</div>
						</div>

						{/* Bước 2 (Phải) */}
						<div className="w-full md:w-1/2 md:pl-12 md:self-end flex gap-6 items-center">
							<div className="hidden md:flex items-center justify-center w-20 h-20 bg-green-500 text-white rounded-full shrink-0 shadow-lg">
								<Camera className="w-10 h-10" />
							</div>
							<div
								className={cn(
									"p-6 text-left",
									whiteBox,
									"flex-1"
								)}
							>
								<h4 className="text-2xl font-semibold mt-2 mb-2 text-blue-800">
									Tập Trung
								</h4>
								<p className="text-gray-700">
									Bắt đầu một phiên học (Pomodoro), chọn task
									và bật camera. A.I. sẽ phân tích độ tập
									trung của bạn trong thời gian thực.
								</p>
							</div>
						</div>

						{/* Bước 3 (Trái) */}
						<div className="w-full md:w-1/2 md:pr-12 flex gap-6 items-center">
							<div
								className={cn(
									"p-6 text-left",
									whiteBox,
									"flex-1"
								)}
							>
								<h4 className="text-2xl font-semibold mt-2 mb-2 text-blue-800">
									Phân Tích
								</h4>
								<p className="text-gray-700">
									Xem lại biểu đồ (
									<PieChart className="inline w-4 h-4" />) sau
									phiên học. Hiểu rõ điểm mạnh, điểm yếu và
									các yếu tố gây xao nhãng để cải thiện.
								</p>
							</div>
							<div className="hidden md:flex items-center justify-center w-20 h-20 bg-purple-500 text-white rounded-full shrink-0 shadow-lg">
								<PieChart className="w-10 h-10" />
							</div>
						</div>

						{/* Bước 4 (Phải) */}
						<div className="w-full md:w-1/2 md:pl-12 md:self-end flex gap-6 items-center">
							<div className="hidden md:flex items-center justify-center w-20 h-20 bg-yellow-500 text-white rounded-full shrink-0 shadow-lg">
								<Star className="w-10 h-10" />
							</div>
							<div
								className={cn(
									"p-6 text-left",
									whiteBox,
									"flex-1"
								)}
							>
								<h4 className="text-2xl font-semibold mt-2 mb-2 text-blue-800">
									Nhận Thưởng
								</h4>
								<p className="text-gray-700">
									Thời gian tập trung được đổi thành điểm.
									Dùng điểm để nuôi pet (
									<Star className="inline w-4 h-4" />
									), mua vật phẩm và leo hạng trên bảng xếp
									hạng.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* === PHẦN 9: CTA & FOOTER === */}
			<footer
				className={cn(
					"h-auto w-screen p-8 py-24 bg-gray-900 text-white relative overflow-hidden"
				)}
			>
				{/* Ảnh nền cho footer */}
				<img
					src={backgroundFooterUrl}
					alt="Footer Background"
					className="absolute inset-0 w-full h-full object-cover z-0 opacity-20"
				/>

				<div className="relative z-10 w-full max-w-7xl mx-auto">
					{/* Nút CTA ở trên */}
					<div className="text-center mb-16 p-8">
						<h2
							className="text-5xl font-bold mb-8 text-white"
							style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
						>
							Sẵn sàng để tập trung?
						</h2>
						<Button
							asChild
							size="lg"
							className="bg-linear-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-lg h-16 px-10 rounded-full text-white"
						>
							<Link href="/register">Tham gia Optimind ngay</Link>
						</Button>
					</div>

					{/* === FOOTER MỞ RỘNG === */}
					<div className="grid grid-cols-2 md:grid-cols-5 gap-8">
						{/* Cột 1: Logo */}
						<div className="col-span-2 md:col-span-1">
							<div className="flex items-center gap-2 mb-4">
								<Brain className="h-7 w-7 text-blue-300" />
								<span className="text-2xl font-bold text-white">
									Optimind
								</span>
							</div>
							<p className="text-gray-400 text-sm">
								© 2025 Optimind. All rights reserved.
							</p>
						</div>

						{/* Cột 2: Công ty */}
						<div>
							<h5 className="font-semibold text-white mb-4">
								Công ty
							</h5>
							<ul className="space-y-3">
								<li>
									<Link
										href="/about"
										className="text-gray-400 hover:text-white"
									>
										Về chúng tôi
									</Link>
								</li>
								<li>
									<Link
										href="/careers"
										className="text-gray-400 hover:text-white"
									>
										Tuyển dụng
									</Link>
								</li>
								<li>
									<Link
										href="/press"
										className="text-gray-400 hover:text-white"
									>
										Báo chí
									</Link>
								</li>
								<li>
									<Link
										href="/blog"
										className="text-gray-400 hover:text-white"
									>
										Blog
									</Link>
								</li>
							</ul>
						</div>
						{/* Cột 3: Ưu đãi */}
						<div>
							<h5 className="font-semibold text-white mb-4">
								Ưu đãi
							</h5>
							<ul className="space-y-3">
								<li>
									<Link
										href="/gift"
										className="text-gray-400 hover:text-white"
									>
										Mua quà tặng
									</Link>
								</li>
								<li>
									<Link
										href="/redeem"
										className="text-gray-400 hover:text-white"
									>
										Đổi quà tặng
									</Link>
								</li>
								<li>
									<Link
										href="/family"
										className="text-gray-400 hover:text-white"
									>
										Gói Gia đình
									</Link>
								</li>
							</ul>
						</div>
						{/* Cột 4: Tổ chức */}
						<div>
							<h5 className="font-semibold text-white mb-4">
								Cho Tổ chức
							</h5>
							<ul className="space-y-3">
								<li>
									<Link
										href="/business"
										className="text-gray-400 hover:text-white"
									>
										Optimind Business
									</Link>
								</li>
								<li>
									<Link
										href="/schools"
										className="text-gray-400 hover:text-white"
									>
										Optimind cho Trường học
									</Link>
								</li>
							</ul>
						</div>
						{/* Cột 5: Hỗ trợ */}
						<div>
							<h5 className="font-semibold text-white mb-4">
								Hỗ trợ
							</h5>
							<ul className="space-y-3">
								<li>
									<Link
										href="#faq"
										className="text-gray-400 hover:text-white"
									>
										FAQ
									</Link>
								</li>
								<li>
									<Link
										href="/contact"
										className="text-gray-400 hover:text-white"
									>
										Liên hệ
									</Link>
								</li>
								<li>
									<Link
										href="/terms"
										className="text-gray-400 hover:text-white"
									>
										Điều khoản
									</Link>
								</li>
								<li>
									<Link
										href="/privacy"
										className="text-gray-400 hover:text-white"
									>
										Bảo mật
									</Link>
								</li>
							</ul>
						</div>
					</div>
					<div className="flex justify-between items-center mt-16 pt-8 border-t border-gray-700">
						<div className="text-gray-500 text-sm">
							{/* Copyright đã chuyển lên trên */}
						</div>
						<div className="flex gap-4">
							<Link
								href="#"
								className="text-gray-400 hover:text-white"
							>
								<Facebook className="w-6 h-6" />
							</Link>
							<Link
								href="#"
								className="text-gray-400 hover:text-white"
							>
								<Twitter className="w-6 h-6" />
							</Link>
							<Link
								href="#"
								className="text-gray-400 hover:text-white"
							>
								<Instagram className="w-6 h-6" />
							</Link>
						</div>
					</div>
				</div>
			</footer>
		</main>
	);
}
