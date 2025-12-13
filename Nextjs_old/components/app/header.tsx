// Tên file: app/components/UserHeader.tsx
"use client";

import React, { FC } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
// MỚI: Imports cho DropdownMenu
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Bell,
	Flame,
	Clock,
	User, // MỚI: Icon
	Settings, // MỚI: Icon
	LogOut, // MỚI: Icon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { clientLogout } from "@/utils/auth-client";

// Hàm tiện ích
const glassEffect =
	"bg-black/40 backdrop-blur-md border border-white/20 rounded-lg shadow-lg";
const dropdownGlassEffect =
	"bg-black/60 backdrop-blur-md border border-white/20 text-white"; // Style riêng cho dropdown

// Định nghĩa Props
interface UserHeaderProps {
	streak: number;
	studyHoursToday: number;
	isUiVisible: boolean; // MỚI: Thêm prop
}

const UserHeader = ({
	streak,
	studyHoursToday,
	isUiVisible,
}: UserHeaderProps) => {
	const router = useRouter();

	// sign out from the current session only
	const onLogout = async () => {
		await clientLogout();
		router.push("/login");
		router.refresh();
	};

	return (
		<TooltipProvider>
			<div
				className={cn(
					"absolute top-2 right-2 z-30 flex items-center gap-2 p-1", // Căn góc trên phải
					glassEffect, // Dùng style kính mờ, bo tròn
					// MỚI: Thêm hiệu ứng ẩn/hiện
					"transition-all duration-300 ease-in-out",
					isUiVisible
						? "opacity-100 translate-y-0"
						: "opacity-0 -translate-y-full"
				)}
			>
				{/* 1. Streak */}
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10">
							<Flame className="w-5 h-5 text-orange-400" />
							<span className="font-semibold text-white">
								{streak} ngày
							</span>
						</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>Chuỗi học (Streak) của bạn</p>
					</TooltipContent>
				</Tooltip>

				{/* 2. Giờ học hôm nay */}
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10">
							<Clock className="w-5 h-5 text-blue-300" />
							<span className="font-semibold text-white">
								{studyHoursToday} giờ
							</span>
						</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>Tổng thời gian đã học hôm nay</p>
					</TooltipContent>
				</Tooltip>

				{/* 3. Nút Thông báo */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-10 w-10 rounded-full text-white hover:bg-white/20"
						>
							<Bell className="w-5 h-5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Thông báo</p>
					</TooltipContent>
				</Tooltip>

				{/* 4. Avatar Người dùng (MỚI: Dùng DropdownMenu) */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Avatar className="h-10 w-10 cursor-pointer border-2 border-white/30">
							<AvatarImage src="/avatars/user.png" alt="User" />
							<AvatarFallback>U</AvatarFallback>
						</Avatar>
					</DropdownMenuTrigger>

					<DropdownMenuContent
						className={cn("", dropdownGlassEffect)} // Áp dụng style kính
						align="end"
					>
						<DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
						<DropdownMenuSeparator className="bg-white/20" />

						<DropdownMenuItem asChild className="cursor-pointer">
							<Link href="/profile">
								<User className="mr-2 h-4 w-4" />
								<span>Hồ sơ</span>
							</Link>
						</DropdownMenuItem>

						<DropdownMenuItem asChild className="cursor-pointer">
							<Link href="/setting">
								<Settings className="mr-2 h-4 w-4" />
								<span>Cài đặt</span>
							</Link>
						</DropdownMenuItem>

						<DropdownMenuSeparator className="bg-white/20" />

						<DropdownMenuItem
							onClick={onLogout}
							className="cursor-pointer text-red-400 focus:text-red-400"
						>
							<LogOut className="mr-2 h-4 w-4" />
							<span>Đăng xuất</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</TooltipProvider>
	);
};

export default UserHeader;
