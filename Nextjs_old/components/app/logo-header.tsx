// Tên file: app/components/LogoHeader.tsx
"use client";

import React, { FC } from "react";
import Link from "next/link";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

// Hàm tiện ích
const glassEffect =
	"bg-black/40 backdrop-blur-md border border-white/20 rounded-lg shadow-lg";

// Định nghĩa Props
interface LogoHeaderProps {
	isUiVisible: boolean;
}

const LogoHeader: FC<LogoHeaderProps> = ({ isUiVisible }) => {
	return (
		<div
			className={cn(
				"absolute top-2 left-2 z-30", // Vị trí: top-6, left-28 (cạnh NavSidebar)
				glassEffect, // Dùng style kính mờ, bo tròn
				// Hiệu ứng ẩn/hiện
				"transition-all duration-300 ease-in-out",
				isUiVisible
					? "opacity-100 translate-y-0"
					: "opacity-0 -translate-y-full"
			)}
		>
			<Link href="/study" className="flex items-center gap-2 px-4 py-2">
				<Brain className="w-7 h-7 text-white" />
				<span className="text-xl font-bold text-white">Optimind</span>
			</Link>
		</div>
	);
};

export default LogoHeader;
