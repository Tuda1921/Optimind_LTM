"use client";
import DraggableCamera from "@/components/app/camera";
import UserHeader from "@/components/app/header";
import LogoHeader from "@/components/app/logo-header";
import NavSidebar from "@/components/app/sidebar";
import ControlToolbar from "@/components/app/toolbar";
import { CameraProvider } from "@/hooks/useCamera";
import { MusicProvider } from "@/hooks/useMusic";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

type NavPageId =
	| "/study"
	| "/chat"
	| "/study-room"
	| "/tasks"
	| "/calendar"
	| "/gamification"
	| "/history"
	| "/ranking";

const AppLayout = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	const [streak, setStreak] = useState<number>(5);
	const [backgroundUrl, setBackgroundUrl] = useState<string>(
		"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop"
	);
	const [studyHoursToday, setStudyHoursToday] = useState<number>(2.5);
	const activePage = usePathname() as NavPageId;

	// MỚI: State cho việc ẩn/hiện UI
	const [isUiVisible, setIsUiVisible] = useState<boolean>(true);
	const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

	// --- MỚI: Logic ẩn/hiện UI ---
	const resetUiTimer = useCallback(() => {
		// 1. Hiển thị UI
		setIsUiVisible(true);

		// 2. Xóa timer cũ (nếu có)
		if (inactivityTimerRef.current) {
			clearTimeout(inactivityTimerRef.current);
		}

		// 3. Đặt timer mới để ẩn UI sau 5 giây
		inactivityTimerRef.current = setTimeout(() => {
			setIsUiVisible(false);
		}, 10000); // 5 giây
	}, []);

	// Effect để gắn listener cho mousemove
	useEffect(() => {
		// Gắn listener
		window.addEventListener("mousemove", resetUiTimer);

		// Bắt đầu timer ngay khi tải trang
		resetUiTimer();

		// Dọn dẹp
		return () => {
			window.removeEventListener("mousemove", resetUiTimer);
			if (inactivityTimerRef.current) {
				clearTimeout(inactivityTimerRef.current);
			}
		};
	}, [resetUiTimer]);

	return (
		<div>
			<MusicProvider>
				<CameraProvider>
					<div
						className="h-screen w-screen text-white transition-all duration-500 overflow-hidden"
						style={{
							backgroundImage: `url(${backgroundUrl})`,
							backgroundSize: "cover",
							backgroundPosition: "center",
						}}
					>
						{/* MỚI: Thêm Logo Header */}
						<LogoHeader isUiVisible={isUiVisible} />
						{/* === 1. Sidebar Trái (Component Tái sử dụng) === */}
						{/* Trang 'study' tương ứng với 'LayoutDashboard' (Trang chủ) */}
						<NavSidebar
							activePage={activePage}
							isUiVisible={isUiVisible}
						/>

						{/* === 2. Toolbar Phải (Đã cập nhật, không còn Avatar) === */}
						<ControlToolbar
							onChangeBackground={(url: string) =>
								setBackgroundUrl(url)
							}
							isUiVisible={isUiVisible}
						/>

						{/* === 3. Header Người dùng (MỚI) === */}
						<UserHeader
							streak={streak}
							studyHoursToday={studyHoursToday}
							isUiVisible={isUiVisible}
						/>

						{/* === 4. Camera Di động (Component Tái sử dụng) === */}
						<DraggableCamera />
						{children}
					</div>
				</CameraProvider>
			</MusicProvider>
		</div>
	);
};

export default AppLayout;
