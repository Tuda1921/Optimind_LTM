// Tên file: app/components/chat/ChatInfoPanel.tsx
"use client";

import React, { useState, FC, ChangeEvent } from "react";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	X,
	Pencil,
	Check,
	BellOff,
	Bell,
	LogOut,
	MoreVertical,
	Trash2,
	UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";

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
	isGroup: boolean;
	members: User[];
	muted: boolean;
}

interface ChatInfoPanelProps {
	chat: Chat;
	allUsers: User[];
	onClose: () => void;
	onRenameGroup: (newName: string) => void;
	onToggleMute: (muted: boolean) => void;
	onLeaveOrDeleteChat: () => void;
	onAddMembers: (memberIds: string[]) => void;
	onRemoveMember: (memberId: string) => void;
	className?: string; // MỚI: Thêm className
}

// --- Component Info Panel ---
const ChatInfoPanel: FC<ChatInfoPanelProps> = ({
	chat,
	allUsers,
	onClose,
	onRenameGroup,
	onToggleMute,
	onLeaveOrDeleteChat,
	onAddMembers,
	onRemoveMember,
	className, // MỚI: Nhận className
}) => {
	// State cục bộ cho việc chỉnh sửa
	const [isRenameOpen, setIsRenameOpen] = useState<boolean>(false);
	const [tempName, setTempName] = useState<string>(chat.name);

	// State cho việc thêm thành viên
	const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
	const [membersToAdd, setMembersToAdd] = useState<string[]>([]);

	const handleSaveRename = () => {
		onRenameGroup(tempName);
		setIsRenameOpen(false);
	};

	const handleAddMembersClick = () => {
		onAddMembers(membersToAdd);
		setIsAddMemberOpen(false);
		setMembersToAdd([]);
	};

	// Lọc ra những user chưa ở trong nhóm
	const usersNotInGroup = allUsers.filter(
		(u) => u.id !== "me" && !chat.members.find((m) => m.id === u.id)
	);

	return (
		// THAY ĐỔI: Áp dụng className, xóa logic flex
		<div
			className={cn(
				"flex flex-col h-full",
				className,
				"animate-in slide-in-from-right-10 duration-300" // Giữ hiệu ứng
			)}
		>
			{/* Header */}
			<div className="p-4 flex justify-between items-center border-b border-white/20">
				<h3 className="text-xl font-bold">Thông tin</h3>
				<Button
					variant="ghost"
					size="icon"
					className="text-white/70 hover:text-white hover:bg-white/20"
					onClick={onClose}
				>
					<X size={20} />
				</Button>
			</div>

			{/* Bọc nội dung trong ScrollArea */}
			<ScrollArea className="flex-1 p-4">
				<div className="flex flex-col gap-4">
					{/* Thông tin cơ bản */}
					<div className="flex flex-col items-center text-center">
						<Avatar className="h-24 w-24 mb-4">
							<AvatarImage src={chat.avatar} />
							<AvatarFallback className="text-4xl">
								{chat.name[0]}
							</AvatarFallback>
						</Avatar>

						<h2 className="text-2xl font-bold">{chat.name}</h2>
						<p className="text-sm text-white/70">
							{chat.isGroup
								? `${chat.members.length} thành viên`
								: "Hồ sơ cá nhân"}
						</p>
					</div>

					<Separator className="bg-white/20" />

					{/* Cài đặt thông báo */}
					<div className="flex items-center justify-between">
						<Label
							htmlFor="mute-switch"
							className="flex items-center gap-2 text-base"
						>
							{chat.muted ? (
								<BellOff size={16} />
							) : (
								<Bell size={16} />
							)}
							Tắt thông báo
						</Label>
						<Switch
							id="mute-switch"
							checked={chat.muted}
							onCheckedChange={onToggleMute}
						/>
					</div>

					{/* Đổi tên (Dùng Dialog) */}
					{chat.isGroup && (
						<>
							<Separator className="bg-white/20" />
							<Dialog
								open={isRenameOpen}
								onOpenChange={setIsRenameOpen}
							>
								<DialogTrigger asChild>
									<Button
										variant="outline"
										className="bg-transparent hover:bg-white/20 justify-start gap-2"
										onClick={() => setTempName(chat.name)} // Cập nhật tempName khi mở
									>
										<Pencil className="h-4 w-4" /> Đổi tên
										nhóm
									</Button>
								</DialogTrigger>
								<DialogContent className="bg-black/70 backdrop-blur-md border-white/20 text-white">
									<DialogHeader>
										<DialogTitle>Đổi tên nhóm</DialogTitle>
									</DialogHeader>
									<Input
										value={tempName}
										onChange={(e) =>
											setTempName(e.target.value)
										}
										className="bg-white/20 border-white/30"
									/>
									<DialogFooter>
										<DialogClose asChild>
											<Button variant="ghost">Hủy</Button>
										</DialogClose>
										<Button onClick={handleSaveRename}>
											Lưu
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</>
					)}

					<Separator className="bg-white/20" />

					{/* Danh sách thành viên */}
					<div className="flex flex-col gap-2">
						<div className="flex justify-between items-center">
							<h4 className="font-semibold">
								Thành viên ({chat.members.length})
							</h4>
							{/* Thêm Dialog cho nút Thêm Thành viên */}
							{chat.isGroup && (
								<Dialog
									open={isAddMemberOpen}
									onOpenChange={setIsAddMemberOpen}
								>
									<DialogTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-white/70 hover:text-white"
										>
											<UserPlus size={16} />
										</Button>
									</DialogTrigger>
									<DialogContent className="bg-black/70 backdrop-blur-md border-white/20 text-white">
										<DialogHeader>
											<DialogTitle>
												Thêm thành viên
											</DialogTitle>
										</DialogHeader>
										<ScrollArea className="h-40">
											<div className="space-y-2">
												{usersNotInGroup.length > 0 ? (
													usersNotInGroup.map(
														(user) => (
															<div
																key={user.id}
																className="flex items-center justify-between p-2 rounded hover:bg-white/10"
															>
																<div className="flex items-center gap-3">
																	<Avatar className="h-8 w-8">
																		<AvatarImage
																			src={
																				user.avatar
																			}
																		/>
																		<AvatarFallback>
																			{
																				user
																					.name[0]
																			}
																		</AvatarFallback>
																	</Avatar>
																	<span>
																		{
																			user.name
																		}
																	</span>
																</div>
																<Checkbox
																	id={`add-${user.id}`}
																	onCheckedChange={(
																		checked
																	) => {
																		setMembersToAdd(
																			(
																				prev
																			) =>
																				checked
																					? [
																							...prev,
																							user.id,
																					  ]
																					: prev.filter(
																							(
																								id
																							) =>
																								id !==
																								user.id
																					  )
																		);
																	}}
																/>
															</div>
														)
													)
												) : (
													<p className="text-center text-gray-400">
														Đã thêm tất cả bạn bè.
													</p>
												)}
											</div>
										</ScrollArea>
										<DialogFooter>
											<DialogClose asChild>
												<Button variant="ghost">
													Hủy
												</Button>
											</DialogClose>
											<Button
												onClick={handleAddMembersClick}
											>
												Thêm
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							)}
						</div>

						{/* ScrollArea cho Thành viên */}
						<ScrollArea className="h-40">
							<div className="space-y-3 pr-4">
								{chat.members.map((member) => (
									<div
										key={member.id}
										className="flex items-center justify-between group"
									>
										<div className="flex items-center gap-3">
											<Avatar className="h-9 w-9">
												<AvatarImage
													src={member.avatar}
												/>
												<AvatarFallback>
													{member.name[0]}
												</AvatarFallback>
											</Avatar>
											<span className="font-medium">
												{member.name}
											</span>
										</div>
										{chat.isGroup && member.id !== "me" && (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 opacity-0 group-hover:opacity-100"
													>
														<MoreVertical
															size={16}
														/>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent className="bg-black/70 backdrop-blur-md border-white/20 text-white">
													<DropdownMenuItem
														onClick={() =>
															onRemoveMember(
																member.id
															)
														}
														className="cursor-pointer text-red-400 focus:text-red-400"
													>
														<Trash2 className="mr-2 h-4 w-4" />
														Xóa khỏi nhóm
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										)}
									</div>
								))}
							</div>
						</ScrollArea>
					</div>
				</div>
			</ScrollArea>

			{/* Nút rời nhóm / Hủy bạn (Ngoài ScrollArea) */}
			<div className="p-4 mt-auto border-t border-white/20">
				<Button
					variant="destructive"
					className="w-full bg-red-600/80 hover:bg-red-600"
					onClick={onLeaveOrDeleteChat}
				>
					<LogOut size={16} className="mr-2" />
					{chat.isGroup ? "Rời nhóm" : "Hủy kết bạn"}
				</Button>
			</div>
		</div>
	);
};

export default ChatInfoPanel;
