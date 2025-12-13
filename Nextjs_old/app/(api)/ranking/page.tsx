// Tên file: app/leaderboard/page.tsx
"use client";

import React, { useState, FC, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	LayoutDashboard,
	CheckSquare,
	Users,
	Trophy,
	BarChart2,
	Settings,
	Bell,
	User,
	Video,
	Music,
	Waves,
	Image as ImageIcon,
	X,
	UserPlus,
	Crown, // Icon cho hạng 1
	Plus,
	Clock, // MỚI
	Brain, // MỚI
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
// MỚI: Imports cho Dialog, Select
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- MỚI: Định nghĩa Types ---
interface RankUser {
	id: string; // Thêm ID
	rank: number;
	name: string;
	studyTime: string;
	focusScore: string;
	avatar: string;
	note?: string;
}

interface Group {
	id: string;
	name: string;
}

interface Rankings {
	system: RankUser[];
	friends: RankUser[];
	groups: Record<string, RankUser[]>; // Key là group.id
}

// --- MỚI: Cấu trúc lại Mock Data ---
const mockAllGroups: Group[] = [
	{ id: "group-1", name: "Nhóm Dự án Optimind" },
	{ id: "group-2", name: "Team Học Sáng" },
];

const mockAllRankings: Rankings = {
	system: [
		{
			id: "u1",
			rank: 1,
			name: "Minh Anh",
			studyTime: "125 giờ",
			focusScore: "92%",
			avatar: "/avatars/04.png",
			note: "Luôn dẫn đầu!",
		},
		{
			id: "u2",
			rank: 2,
			name: "Thanh Tùng",
			studyTime: "110 giờ",
			focusScore: "88%",
			avatar: "/avatars/02.png",
			note: "Chăm chỉ và nhiệt huyết.",
		},
		{
			id: "u3",
			rank: 3,
			name: "Ngọc Lan",
			studyTime: "105 giờ",
			focusScore: "90%",
			avatar: "/avatars/03.png",
			note: "Tập trung cao độ.",
		},
		{
			id: "u4",
			rank: 4,
			name: "Hoàng Phúc",
			studyTime: "98 giờ",
			focusScore: "85%",
			avatar: "/avatars/05.png",
		},
		{
			id: "u5",
			rank: 5,
			name: "Kim Ngân",
			studyTime: "90 giờ",
			focusScore: "87%",
			avatar: "/avatars/01.png",
		},
	],
	friends: [
		{
			id: "u3",
			rank: 1,
			name: "Ngọc Lan",
			studyTime: "105 giờ",
			focusScore: "90%",
			avatar: "/avatars/03.png",
			note: "Bestie của tôi!",
		},
		{
			id: "u5",
			rank: 2,
			name: "Kim Ngân",
			studyTime: "90 giờ",
			focusScore: "87%",
			avatar: "/avatars/01.png",
		},
		{
			id: "u4",
			rank: 3,
			name: "Hoàng Phúc",
			studyTime: "98 giờ",
			focusScore: "85%",
			avatar: "/avatars/05.png",
		},
	],
	groups: {
		"group-1": [
			{
				id: "u2",
				rank: 1,
				name: "Thanh Tùng",
				studyTime: "110 giờ",
				focusScore: "88%",
				avatar: "/avatars/02.png",
				note: "Leader nhóm A.",
			},
			{
				id: "u1",
				rank: 2,
				name: "Minh Anh",
				studyTime: "125 giờ",
				focusScore: "92%",
				avatar: "/avatars/04.png",
				note: "Thành viên tích cực.",
			},
		],
		"group-2": [
			{
				id: "u4",
				rank: 1,
				name: "Hoàng Phúc",
				studyTime: "98 giờ",
				focusScore: "85%",
				avatar: "/avatars/05.png",
			},
		],
	},
};

const userSelfInfo: RankUser = {
	id: "me",
	rank: 4,
	name: "Bạn",
	studyTime: "98 giờ",
	focusScore: "85%",
	avatar: "/avatars/user.png",
	note: "Bạn đang trong top 5 hệ thống!",
};
// --- Kết thúc Mock Data ---

export default function LeaderboardPage() {
	// === State quản lý giao diện ===
	const [backgroundUrl, setBackgroundUrl] = useState<string>(
		"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop"
	);
	const [isCameraOn, setCameraOn] = useState(false);

	// Hàm tiện ích
	const glassEffect =
		"bg-black/30 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

	// --- STATE ---
	const [allGroups, setAllGroups] = useState<Group[]>(mockAllGroups);
	const [allRankings, setAllRankings] = useState<Rankings>(mockAllRankings);

	const [selectedRankCategory, setSelectedRankCategory] = useState<
		"system" | "friends" | "group"
	>("system");
	const [selectedUser, setSelectedUser] = useState<RankUser | null>(null);
	const [showUserDetails, setShowUserDetails] = useState<boolean>(false);

	// State cho Nhóm
	const [currentGroupId, setCurrentGroupId] = useState<string>(
		allGroups[0].id
	);
	const [isCreateGroupOpen, setIsCreateGroupOpen] = useState<boolean>(false);
	const [newGroupName, setNewGroupName] = useState<string>("");

	// --- HANDLERS ---
	const handleUserClick = (user: RankUser) => {
		setSelectedUser(user);
		setShowUserDetails(true); // Hiển thị cột chi tiết
	};

	const handleCreateGroup = () => {
		if (!newGroupName.trim()) return;

		const newGroup: Group = {
			id: `group-${crypto.randomUUID()}`,
			name: newGroupName,
		};

		// Cập nhật danh sách nhóm
		setAllGroups((prev) => [...prev, newGroup]);
		// Cập nhật bảng xếp hạng (thêm 1 mảng rỗng)
		setAllRankings((prev) => ({
			...prev,
			groups: {
				...prev.groups,
				[newGroup.id]: [],
			},
		}));
		// Tự động chọn nhóm mới
		setCurrentGroupId(newGroup.id);
		// Đóng dialog
		setIsCreateGroupOpen(false);
		setNewGroupName("");
	};

	// Lấy danh sách ranking hiện tại dựa trên tab
	const currentRankingList: RankUser[] = useMemo(() => {
		if (selectedRankCategory === "system") return allRankings.system;
		if (selectedRankCategory === "friends") return allRankings.friends;
		if (selectedRankCategory === "group")
			return allRankings.groups[currentGroupId] || [];
		return [];
	}, [selectedRankCategory, allRankings, currentGroupId]);

	return (
		<main
			className="h-screen w-screen text-white p-6 transition-all duration-500"
			style={{
				backgroundImage: `url(${backgroundUrl})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			<div className="relative w-full h-full">
				{/* === UI Components (UserHeader, NavSidebar, ControlToolbar) === */}
				{/* (Tạm ẩn đi để tập trung vào nội dung chính) */}

				{/* === Bố cục 2 Cột Lớn === */}
				<div
					className={cn(
						"absolute top-20 bottom-6 left-24 right-24", // Định vị giữa
						"flex gap-0", // Bỏ gap, dùng divide
						glassEffect,
						"overflow-hidden"
					)}
				>
					{/* --- CỘT 1: BẢNG XẾP HẠNG CHÍNH --- */}
					<section
						className={cn(
							"p-4 flex flex-col gap-4 transition-all duration-300",
							// THAY ĐỔI: flex-1 để tự động co dãn
							"flex-1"
						)}
					>
						<div className="p-4 border-b border-white/10">
							<h2 className="text-2xl font-bold">Ranks</h2>
							<Tabs
								value={selectedRankCategory}
								onValueChange={(val) =>
									setSelectedRankCategory(
										val as "system" | "friends" | "group"
									)
								}
								className="mt-4"
							>
								<TabsList className="grid w-full grid-cols-3 bg-white/10 text-white">
									<TabsTrigger value="system">
										Hệ thống
									</TabsTrigger>
									<TabsTrigger value="friends">
										Bạn bè
									</TabsTrigger>
									<TabsTrigger value="group">
										Nhóm
									</TabsTrigger>
								</TabsList>

								{/* Nội dung Tab Nhóm (chỉ header) */}
								<TabsContent value="group" className="mt-4 p-0">
									<div className="flex justify-between items-center">
										<Select
											value={currentGroupId}
											onValueChange={setCurrentGroupId}
										>
											<SelectTrigger className="w-[250px] bg-white/10 border-white/30">
												<SelectValue placeholder="Chọn nhóm..." />
											</SelectTrigger>
											<SelectContent className="bg-black/70 backdrop-blur-md border-white/20 text-white">
												{allGroups.map((group) => (
													<SelectItem
														key={group.id}
														value={group.id}
													>
														{group.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										<Dialog
											open={isCreateGroupOpen}
											onOpenChange={setIsCreateGroupOpen}
										>
											<DialogTrigger asChild>
												<Button className="gap-2 bg-blue-600 hover:bg-blue-700">
													<Plus size={16} /> Tạo Nhóm
												</Button>
											</DialogTrigger>
											<DialogContent className="bg-black/70 backdrop-blur-md border-white/20 text-white">
												<DialogHeader>
													<DialogTitle>
														Tạo Nhóm Xếp Hạng
													</DialogTitle>
												</DialogHeader>
												<div className="py-4">
													<Label htmlFor="group-name">
														Tên nhóm
													</Label>
													<Input
														id="group-name"
														value={newGroupName}
														onChange={(e) =>
															setNewGroupName(
																e.target.value
															)
														}
														className="bg-white/10 border-white/30"
													/>
												</div>
												<DialogFooter>
													<DialogClose asChild>
														<Button variant="ghost">
															Hủy
														</Button>
													</DialogClose>
													<Button
														onClick={
															handleCreateGroup
														}
													>
														Tạo
													</Button>
												</DialogFooter>
											</DialogContent>
										</Dialog>
									</div>
								</TabsContent>
							</Tabs>
						</div>

						<ScrollArea className="flex-1 px-4">
							{currentRankingList.map((user) => (
								<div
									key={user.id}
									className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-white/10"
									onClick={() => handleUserClick(user)} // Xử lý khi click
								>
									<span
										className={`w-8 text-center text-lg font-bold ${
											user.rank <= 3
												? "text-yellow-400"
												: "text-gray-300"
										}`}
									>
										{user.rank === 1 ? (
											<Crown className="inline-block h-5 w-5 text-yellow-400 -mt-1" />
										) : (
											user.rank
										)}
									</span>
									<Avatar className="h-10 w-10">
										<AvatarImage
											src={user.avatar}
											alt={user.name}
										/>
										<AvatarFallback>
											{user.name.substring(0, 2)}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1 overflow-hidden">
										<p className="font-semibold truncate text-white">
											{user.name}
										</p>
									</div>
									<span className="text-sm text-gray-300">
										{user.studyTime}
									</span>
								</div>
							))}
						</ScrollArea>

						{/* Thông tin của chính người dùng (Your Rank) */}
						<div className="border-t border-white/10 bg-white/10 rounded-b-lg p-4 mt-auto">
							<div className="flex items-center gap-3">
								<span
									className={`w-8 text-center text-lg font-bold ${
										userSelfInfo.rank <= 3
											? "text-yellow-400"
											: "text-gray-300"
									}`}
								>
									{userSelfInfo.rank === 1 ? (
										<Crown className="inline-block h-5 w-5 text-yellow-400 -mt-1" />
									) : (
										userSelfInfo.rank
									)}
								</span>
								<Avatar className="h-10 w-10 border-2 border-blue-400">
									<AvatarImage
										src={userSelfInfo.avatar}
										alt={userSelfInfo.name}
									/>
									<AvatarFallback>Bạn</AvatarFallback>
								</Avatar>
								<div className="flex-1 overflow-hidden">
									<p className="font-semibold truncate text-white">
										Bạn
									</p>
								</div>
								<span className="text-sm text-gray-300">
									{userSelfInfo.studyTime}
								</span>
							</div>
						</div>
					</section>

					{/* --- CỘT 2: CHI TIẾT NGƯỜI DÙNG (Giữa-Phải) --- */}
					{showUserDetails && selectedUser && (
						<aside
							className={cn(
								// THAY ĐỔI: w-80 -> w-96 (384px)
								"flex-shrink-0 w-96 p-4 flex flex-col gap-4 border-l border-white/20",
								"animate-in slide-in-from-right-10 duration-300"
							)}
						>
							{/* Nút đóng */}
							<Button
								onClick={() => setShowUserDetails(false)}
								variant="ghost"
								size="icon"
								className="text-gray-300 hover:bg-white/20 hover:text-white absolute top-4 right-4"
							>
								<X className="h-5 w-5" />
							</Button>

							{/* Banner */}
							<div className="w-full h-20 rounded-lg bg-blue-500/30" />

							{/* Avatar và Tên (chồng lên banner) */}
							<div className="flex flex-col items-center -mt-16">
								<Avatar className="h-24 w-24 border-4 border-black/30">
									<AvatarImage
										src={selectedUser.avatar}
										alt={selectedUser.name}
									/>
									<AvatarFallback className="text-3xl text-gray-700">
										{selectedUser.name.substring(0, 2)}
									</AvatarFallback>
								</Avatar>
								<h2 className="text-2xl font-bold text-white mt-4">
									{selectedUser.name}
								</h2>
								{selectedUser.note && (
									<p className="text-sm text-gray-300 italic mt-1">
										"{selectedUser.note}"
									</p>
								)}
							</div>

							<Separator className="bg-white/20" />

							{/* Stats */}
							<div className="space-y-3">
								<h3 className="font-semibold text-gray-200">
									Thống kê
								</h3>
								<div className="flex items-center gap-3">
									<Clock className="w-5 h-5 text-gray-300" />
									<span className="text-white">
										Tổng thời gian:
									</span>
									<span className="ml-auto font-bold text-white">
										{selectedUser.studyTime}
									</span>
								</div>
								<div className="flex items-center gap-3">
									<Brain className="w-5 h-5 text-gray-300" />
									<span className="text-white">
										Tập trung TB:
									</span>
									<span className="ml-auto font-bold text-green-400">
										{selectedUser.focusScore}
									</span>
								</div>
							</div>

							<Separator className="bg-white/20" />

							{/* Nút Hành động */}
							<Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
								<UserPlus className="h-4 w-4" /> Kết bạn
							</Button>
						</aside>
					)}
				</div>
			</div>
		</main>
	);
}
