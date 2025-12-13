// Tên file: app/connect/page.tsx
"use client";

import React, { useState, FC } from "react";
import { cn } from "@/lib/utils";
import ContactSidebar from "@/components/chat/chat-list";
import ChatWindow from "@/components/chat/chat-message";
import ChatInfoPanel from "@/components/chat/chat-info";

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
	isGroup: boolean;
	members: User[];
	muted: boolean;
}
interface Message {
	id: string;
	senderId: string;
	senderName?: string;
	text: string;
	timestamp: string;
}

// --- Dữ liệu giả (Mock Data) ---
const mockUserList: User[] = [
	{ id: "friend-1", name: "Alice", avatar: "https://github.com/shadcn.png" },
	{ id: "friend-2", name: "Bob", avatar: "https://github.com/shadcn.png" },
	{ id: "user-3", name: "Charlie", avatar: "https://github.com/shadcn.png" },
	{ id: "user-4", name: "David", avatar: "https://github.com/shadcn.png" },
];

const mockRequests: User[] = [mockUserList[2], mockUserList[3]];

const initialFriendsList: Chat[] = [
	{
		id: "friend-1",
		name: "Alice",
		avatar: "https://github.com/shadcn.png",
		lastMessage: "OK, hẹn gặp bạn chiều nay!",
		isGroup: false,
		members: [
			{ id: "me", name: "Bạn", avatar: "/avatars/user.png" },
			mockUserList[0],
		],
		muted: false,
	},
	{
		id: "friend-2",
		name: "Bob",
		avatar: "https://github.com/shadcn.png",
		lastMessage:
			"Bạn đã xem tài liệu mình gửi chưa? Tin nhắn này rất dài để kiểm tra xem nó có bị tràn ra ngoài không. Hy vọng là không!",
		isGroup: false,
		members: [
			{ id: "me", name: "Bạn", avatar: "/avatars/user.png" },
			mockUserList[1],
		],
		muted: true,
	},
	{
		id: "group-1",
		name: "Nhóm Dự án Optimind",
		avatar: "https://github.com/shadcn.png",
		lastMessage: "Alice: Nhớ push code trước 5h nhé.",
		isGroup: true,
		members: [
			{ id: "me", name: "Bạn", avatar: "/avatars/user.png" },
			mockUserList[0],
			mockUserList[1],
		],
		muted: false,
	},
];

const initialAllMessages: Record<string, Message[]> = {
	"friend-1": [
		{
			id: "m1",
			senderId: "friend-1",
			text: "Hey! Đang làm gì đó?",
			timestamp: "10:30",
		},
		{
			id: "m2",
			senderId: "me",
			text: "Chào, mình đang code trang chat.",
			timestamp: "10:31",
		},
		{
			id: "m3",
			senderId: "friend-1",
			text: "OK, hẹn gặp bạn chiều nay!",
			timestamp: "10:32",
		},
	],
	"friend-2": [
		{
			id: "m4",
			senderId: "friend-2",
			text: "Bạn đã xem tài liệu mình gửi chưa?",
			timestamp: "11:00",
		},
	],
	"group-1": [
		{
			id: "m5",
			senderId: "friend-1",
			senderName: "Alice",
			text: "Nhớ push code trước 5h nhé.",
			timestamp: "11:30",
		},
		{
			id: "m6",
			senderId: "friend-2",
			senderName: "Bob",
			text: "Ok, mình đang làm dở.",
			timestamp: "11:31",
		},
	],
};
// --- Kết thúc Mock Data ---

export default function ConnectPage() {
	// === State quản lý giao diện ===
	const [backgroundUrl, setBackgroundUrl] = useState<string>(
		"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop"
	);

	// === State cho Chat (Quản lý tại đây) ===
	const [chats, setChats] = useState<Chat[]>(initialFriendsList);
	const [requests, setRequests] = useState<User[]>(mockRequests);
	const [selectedChatId, setSelectedChatId] = useState<string | null>(
		chats[0].id
	);
	const [allMessages, setAllMessages] =
		useState<Record<string, Message[]>>(initialAllMessages);

	// State cho Panel Thông tin
	const [isInfoPanelOpen, setInfoPanelOpen] = useState<boolean>(false);

	// Lấy thông tin chat đang được chọn
	const selectedChat =
		chats.find((chat) => chat.id === selectedChatId) || null;
	const currentMessages = allMessages[selectedChatId || ""] || [];

	// Hàm tiện ích
	const glassEffect =
		"bg-black/40 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

	// --- Handlers (Đã cắt gọn) ---
	const handleSendMessage = (messageText: string) => {
		if (!messageText.trim() || !selectedChatId) return;
		const newMsg: Message = {
			id: crypto.randomUUID(),
			senderId: "me",
			text: messageText,
			timestamp: new Date().toLocaleTimeString("vi-VN", {
				hour: "2-digit",
				minute: "2-digit",
			}),
		};
		setAllMessages((prev) => ({
			...prev,
			[selectedChatId]: [...(prev[selectedChatId] || []), newMsg],
		}));
		setChats((prev) =>
			prev.map((chat) =>
				chat.id === selectedChatId
					? { ...chat, lastMessage: `Bạn: ${messageText}` }
					: chat
			)
		);
	};

	const handleCreateGroup = (groupName: string, memberIds: string[]) => {
		if (!groupName.trim() || memberIds.length < 1) return;
		const newGroupId = crypto.randomUUID();
		const members = mockUserList.filter(
			(user) => memberIds.includes(user.id) && user.id !== "me"
		);
		const newGroup: Chat = {
			id: newGroupId,
			name: groupName,
			avatar: "https://github.com/shadcn.png",
			lastMessage: "Đã tạo nhóm.",
			isGroup: true,
			members: [
				{ id: "me", name: "Bạn", avatar: "/avatars/user.png" },
				...members,
			],
			muted: false,
		};
		setChats([newGroup, ...chats]);
		setAllMessages((prev) => ({ ...prev, [newGroupId]: [] }));
		setSelectedChatId(newGroupId);
	};

	const handleRenameGroup = (newName: string) => {
		if (!newName.trim() || !selectedChatId) return;
		setChats(
			chats.map((chat) =>
				chat.id === selectedChatId ? { ...chat, name: newName } : chat
			)
		);
	};

	const handleToggleMute = (muted: boolean) => {
		if (!selectedChatId) return;
		setChats(
			chats.map((chat) =>
				chat.id === selectedChatId ? { ...chat, muted } : chat
			)
		);
	};

	const handleLeaveOrDeleteChat = () => {
		if (!selectedChatId) return;
		const newChats = chats.filter((chat) => chat.id !== selectedChatId);
		setChats(newChats);
		setAllMessages((prev) => {
			const newMessages = { ...prev };
			delete newMessages[selectedChatId];
			return newMessages;
		});
		setSelectedChatId(newChats.length > 0 ? newChats[0].id : null);
		setInfoPanelOpen(false);
	};

	const handleAcceptRequest = (userId: string) => {
		const user = requests.find((r) => r.id === userId);
		if (!user) return;
		setRequests((prev) => prev.filter((r) => r.id !== userId));
		const newChatId = crypto.randomUUID();
		const newChat: Chat = {
			id: newChatId,
			name: user.name,
			avatar: user.avatar,
			lastMessage: "Đã chấp nhận lời mời.",
			isGroup: false,
			members: [
				{ id: "me", name: "Bạn", avatar: "/avatars/user.png" },
				user,
			],
			muted: false,
		};
		setChats((prev) => [newChat, ...prev]);
		setAllMessages((prev) => ({ ...prev, [newChatId]: [] }));
		setSelectedChatId(newChatId);
	};

	const handleDeclineRequest = (userId: string) => {
		setRequests((prev) => prev.filter((r) => r.id !== userId));
	};

	const handleAddMembers = (memberIds: string[]) => {
		if (!selectedChatId) return;
		const membersToAdd = mockUserList.filter((user) =>
			memberIds.includes(user.id)
		);
		setChats(
			chats.map((chat) =>
				chat.id === selectedChatId
					? { ...chat, members: [...chat.members, ...membersToAdd] }
					: chat
			)
		);
	};

	const handleRemoveMember = (memberId: string) => {
		if (!selectedChatId) return;
		setChats(
			chats.map((chat) =>
				chat.id === selectedChatId
					? {
							...chat,
							members: chat.members.filter(
								(m) => m.id !== memberId
							),
					  }
					: chat
			)
		);
	};

	// Lấy tên người gửi (cho nhóm chat)
	const getSender = (senderId: string): User | undefined => {
		if (senderId === "me")
			return { id: "me", name: "Bạn", avatar: "/avatars/user.png" };
		return selectedChat?.members.find((m) => m.id === senderId);
	};

	return (
		<main className="h-screen w-screen text-white p-6 transition-all duration-500">
			<div className="absolute inset-0 w-full h-full" />
			<div className="relative w-full h-full">
				{/* === Nội dung chính - Chat === */}
				<div
					className={cn(
						"absolute top-20 bottom-6 left-24 right-24", // Vị trí
						"flex divide-x divide-white/20",
						glassEffect,
						"overflow-hidden"
					)}
				>
					{/* --- Cột 1: Sidebar Chat (Danh sách) --- */}
					<ContactSidebar
						// THAY ĐỔI: Sử dụng flex-grow 1
						className={cn("")}
						chats={chats}
						requests={requests}
						selectedChatId={selectedChatId}
						onSelectChat={(chatId) => {
							setSelectedChatId(chatId);
							setInfoPanelOpen(false);
						}} // Tắt info panel khi đổi chat
						onCreateGroup={handleCreateGroup}
						onAcceptRequest={handleAcceptRequest}
						onDeclineRequest={handleDeclineRequest}
						allUsers={mockUserList} // Cần cho dialog tạo nhóm
					/>

					{/* --- Cột 2: Khung Chat Chi tiết (Rộng 1.5 lần 2 cột kia) --- */}
					<ChatWindow
						// THAY ĐỔI: Sử dụng flex-grow 1.5 (Nếu 3 cột, chiếm 3/5 tổng flex)
						className={cn(
							"flex-1",
							isInfoPanelOpen ? "flex-[1.5]" : "flex-[2.5]"
						)}
						selectedChat={selectedChat}
						currentMessages={currentMessages}
						isInfoPanelOpen={isInfoPanelOpen}
						onInfoToggle={() => setInfoPanelOpen(!isInfoPanelOpen)}
						onSendMessage={handleSendMessage}
						getSender={getSender}
					/>

					{/* --- Cột 3: Info Panel (Thông tin) --- */}
					{isInfoPanelOpen && selectedChat && (
						<ChatInfoPanel
							// THAY ĐỔI: Sử dụng flex-grow 1
							className="flex-1 w-96 max-w-sm border-l border-white/20"
							key={selectedChat.id}
							chat={selectedChat}
							allUsers={mockUserList}
							onClose={() => setInfoPanelOpen(false)}
							onRenameGroup={handleRenameGroup}
							onToggleMute={handleToggleMute}
							onLeaveOrDeleteChat={handleLeaveOrDeleteChat}
							onAddMembers={handleAddMembers}
							onRemoveMember={handleRemoveMember}
						/>
					)}
				</div>
			</div>
		</main>
	);
}
