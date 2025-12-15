// Tên file: app/components/chat/ContactSidebar.tsx
"use client";

import React, { useState, FC } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Search,
	UserPlus,
	MessageCircle,
	Users2 as GroupIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Định nghĩa Types ---
interface User {
	id: string;
	name: string;
	avatar: string;
}

interface Chat {
	id: string;
	name: string;
	avatar: string;
	lastMessage: string;
}

interface ContactSidebarProps {
	chats: Chat[];
	requests: User[];
	selectedChatId: string | null;
	onSelectChat: (chatId: string) => void;
	onCreateGroup: (groupName: string, memberIds: string[]) => void;
	onAcceptRequest: (userId: string) => void;
	onDeclineRequest: (userId: string) => void;
	allUsers: User[]; // Đổi tên từ mockUserList
	className?: string; // MỚI: Thêm className
}

// --- Component Sidebar ---
const ContactSidebar: FC<ContactSidebarProps> = ({
	chats,
	requests,
	selectedChatId,
	onSelectChat,
	onCreateGroup,
	onAcceptRequest,
	onDeclineRequest,
	allUsers,
	className, // MỚI: Nhận className
}) => {
	const [activeTab, setActiveTab] = useState<"friends" | "requests">(
		"friends"
	);

	// State cho Dialog Tạo Nhóm (di chuyển vào đây)
	const [isCreateGroupOpen, setIsCreateGroupOpen] = useState<boolean>(false);
	const [newGroupName, setNewGroupName] = useState<string>("");
	const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);

	const handleCreateGroupClick = () => {
		onCreateGroup(newGroupName, newGroupMembers);
		// Reset và đóng dialog
		setIsCreateGroupOpen(false);
		setNewGroupName("");
		setNewGroupMembers([]);
	};

	return (
		// THAY ĐỔI: Áp dụng className, xóa logic flex
		<div
			className={cn(
				"p-4 flex flex-col gap-4 transition-all duration-300",
				className
			)}
		>
			{/* Thanh tìm kiếm */}
			<div className="relative">
				<Search
					className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
					size={18}
				/>
				<Input
					placeholder="Tìm kiếm người dùng..."
					className="bg-white/10 border-none pl-10 focus-visible:ring-1 focus-visible:ring-white/80"
				/>
			</div>

			{/* Nút tạo nhóm chat (MỞ DIALOG) */}
			<Dialog
				open={isCreateGroupOpen}
				onOpenChange={setIsCreateGroupOpen}
			>
				<DialogTrigger asChild>
					<Button
						variant="outline"
						className="bg-transparent hover:bg-white/20 text-white"
					>
						<GroupIcon size={16} className="mr-2" /> Tạo nhóm chat
					</Button>
				</DialogTrigger>
				<DialogContent className="bg-black/70 backdrop-blur-md border-white/20 text-white">
					<DialogHeader>
						<DialogTitle>Tạo nhóm chat mới</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							placeholder="Đặt tên nhóm..."
							className="bg-white/10 border-white/30"
							value={newGroupName}
							onChange={(e) => setNewGroupName(e.target.value)}
						/>
						<Label>Thêm thành viên</Label>
						<ScrollArea className="h-40">
							<div className="space-y-2">
								{/* Lọc ra chính mình */}
								{allUsers
									.filter((u) => u.id !== "me")
									.map((user) => (
										<div
											key={user.id}
											className="flex items-center justify-between p-2 rounded hover:bg-white/10"
										>
											<div className="flex items-center gap-3">
												<Avatar className="h-8 w-8">
													<AvatarImage
														src={user.avatar}
													/>
													<AvatarFallback>
														{user.name[0]}
													</AvatarFallback>
												</Avatar>
												<span>{user.name}</span>
											</div>
											<Checkbox
												id={`add-${user.id}`}
												onCheckedChange={(checked) => {
													setNewGroupMembers((prev) =>
														checked
															? [...prev, user.id]
															: prev.filter(
																	(id) =>
																		id !==
																		user.id
															  )
													);
												}}
											/>
										</div>
									))}
							</div>
						</ScrollArea>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="ghost">Hủy</Button>
						</DialogClose>
						<Button onClick={handleCreateGroupClick}>Tạo</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Tabs (Bạn bè / Lời mời) */}
			<div className="grid grid-cols-2 gap-2">
				<Button
					variant={activeTab === "friends" ? "secondary" : "ghost"}
					className={cn(
						activeTab === "friends" &&
							"bg-white/30 hover:bg-white/40 text-white",
						activeTab !== "friends" &&
							"hover:bg-white/10 text-white/70"
					)}
					onClick={() => setActiveTab("friends")}
				>
					<MessageCircle size={16} className="mr-2" /> Bạn bè (
					{chats.length})
				</Button>
				<Button
					variant={activeTab === "requests" ? "secondary" : "ghost"}
					className={cn(
						activeTab === "requests" &&
							"bg-white/30 hover:bg-white/40 text-white",
						activeTab !== "requests" &&
							"hover:bg-white/10 text-white/70"
					)}
					onClick={() => setActiveTab("requests")}
				>
					<UserPlus size={16} className="mr-2" /> Lời mời (
					{requests.length})
				</Button>
			</div>

			{/* Danh sách (scrollable) */}
			<ScrollArea className="flex-1 -mr-4 pr-3 space-y-2">
				{activeTab === "friends" &&
					chats.map((chat) => (
						<button
							key={chat.id}
							onClick={() => onSelectChat(chat.id)}
							className={cn(
								"w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors",
								"hover:bg-white/20",
								selectedChatId === chat.id && "bg-white/20"
							)}
						>
							<Avatar className="h-10 w-10">
								<AvatarImage src={chat.avatar} />
								<AvatarFallback>{chat.name[0]}</AvatarFallback>
							</Avatar>
							<div className="flex-1 overflow-hidden min-w-0">
								<h4 className="font-semibold truncate">
									{chat.name}
								</h4>
								<p className="text-xs text-white/70 truncate overflow-hidden">
									{chat.lastMessage.toString().length > 30
										? `${chat.lastMessage
												.toString()
												.slice(0, 30)}...`
										: chat.lastMessage}
								</p>
							</div>
						</button>
					))}

				{activeTab === "requests" &&
					requests.map((req) => (
						<div
							key={req.id}
							className="w-full p-3 rounded-lg flex items-center justify-between gap-3 bg-black/20"
						>
							<div className="flex items-center gap-3">
								<Avatar className="h-10 w-10">
									<AvatarImage src={req.avatar} />
									<AvatarFallback>
										{req.name[0]}
									</AvatarFallback>
								</Avatar>
								<h4 className="font-semibold truncate">
									{req.name}
								</h4>
							</div>
							<div className="flex gap-2">
								<Button
									size="sm"
									className="bg-blue-600 hover:bg-blue-700"
									onClick={() => onAcceptRequest(req.id)}
								>
									Chấp nhận
								</Button>
								<Button
									size="sm"
									variant="ghost"
									className="hover:bg-white/20"
									onClick={() => onDeclineRequest(req.id)}
								>
									Xóa
								</Button>
							</div>
						</div>
					))}
			</ScrollArea>
		</div>
	);
};

export default ContactSidebar;
