// Tên file: app/components/chat/ChatWindow.tsx
"use client";

import React, { useState, FC, useEffect, useRef } from "react"; // MỚI: Thêm useEffect, useRef
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, Send } from "lucide-react";
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
	isGroup: boolean;
	members: User[];
}

interface Message {
	id: string;
	senderId: string;
	senderName?: string;
	text: string;
	timestamp: string;
}

interface ChatWindowProps {
	selectedChat: Chat | null;
	currentMessages: Message[];
	isInfoPanelOpen: boolean;
	onInfoToggle: () => void;
	onSendMessage: (messageText: string) => void;
	getSender: (senderId: string) => User | undefined;
	className?: string; // MỚI: Thêm className
}

// --- Component Cửa sổ Chat ---
const ChatWindow: FC<ChatWindowProps> = ({
	selectedChat,
	currentMessages,
	isInfoPanelOpen,
	onInfoToggle,
	onSendMessage,
	getSender,
	className, // MỚI: Nhận className
}) => {
	// State cục bộ cho input
	const [newMessage, setNewMessage] = useState<string>("");

	// MỚI: Ref cho scroll area
	const scrollViewportRef = useRef<HTMLDivElement>(null);

	// MỚI: Effect để cuộn xuống dưới
	useEffect(() => {
		if (scrollViewportRef.current) {
			// Cuộn xuống dưới cùng
			scrollViewportRef.current.scrollTop =
				scrollViewportRef.current.scrollHeight;
		}
	}, [currentMessages]); // Chạy mỗi khi có tin nhắn mới

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSendMessage(newMessage);
		setNewMessage("");
	};

	return (
		// THAY ĐỔI: Áp dụng className, xóa logic flex
		<div
			className={cn(
				"flex flex-col h-full transition-all duration-300",
				className
			)}
		>
			{selectedChat ? (
				<>
					{/* Header của Chat */}
					<div className="p-4 flex items-center justify-between border-b border-white/20">
						<div className="flex items-center gap-3">
							<Avatar>
								<AvatarImage src={selectedChat.avatar} />
								<AvatarFallback>
									{selectedChat.name[0]}
								</AvatarFallback>
							</Avatar>
							<h3 className="text-lg font-bold">
								{selectedChat.name}
							</h3>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="text-white/70 hover:text-white hover:bg-white/20"
							onClick={onInfoToggle}
						>
							<Info size={20} />
						</Button>
					</div>

					{/* Nội dung tin nhắn (scrollable) */}
					{/* THAY ĐỔI: Thêm ref vào ScrollArea Viewport */}
					<ScrollArea
						className="flex-1 p-4 h-100"
						ref={scrollViewportRef}
					>
						<div className="space-y-4">
							{" "}
							{/* Thêm space-y-4 */}
							{currentMessages.map((msg) => {
								const isMe = msg.senderId === "me";
								const sender = getSender(msg.senderId);

								return (
									<div
										key={msg.id}
										className={cn(
											"flex items-end gap-2",
											isMe
												? "justify-end"
												: "justify-start"
										)}
									>
										{!isMe && (
											<Avatar className="h-8 w-8">
												<AvatarImage
													src={sender?.avatar}
												/>
												<AvatarFallback>
													{sender?.name[0]}
												</AvatarFallback>
											</Avatar>
										)}
										<div
											className={cn(
												"p-3 rounded-lg max-w-xs",
												isMe
													? "bg-blue-600 text-white"
													: "bg-white/20"
											)}
										>
											{selectedChat.isGroup && !isMe && (
												<p className="text-xs font-semibold text-blue-300 mb-1">
													{sender?.name}
												</p>
											)}
											<p className="text-sm wrap-break-word">
												{msg.text}
											</p>
											<p className="text-xs text-white/70 mt-1 text-right">
												{msg.timestamp}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</ScrollArea>

					{/* Khung nhập tin nhắn */}
					<form
						className="p-4 border-t border-white/20"
						onSubmit={handleSubmit}
					>
						<div className="flex gap-2">
							<Input
								placeholder="Nhập tin nhắn..."
								className="bg-white/10 border-none focus-visible:ring-1 focus-visible:ring-white/80"
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
							/>
							<Button
								type="submit"
								className="bg-blue-600 hover:bg-blue-700"
							>
								<Send size={18} />
							</Button>
						</div>
					</form>
				</>
			) : (
				<div className="h-full flex items-center justify-center text-white/50">
					<p>Chọn một đoạn chat để bắt đầu</p>
				</div>
			)}
		</div>
	);
};

export default ChatWindow;
