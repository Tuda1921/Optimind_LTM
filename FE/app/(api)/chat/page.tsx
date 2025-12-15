// app/chat/page.tsx
"use client";

import React, { useState, useEffect, FC } from "react";
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

export default function ChatPage() {
  // === State quản lý giao diện ===
  const [backgroundUrl] = useState<string>(
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop"
  );

  // === State cho Chat ===
  const [chats, setChats] = useState<Chat[]>([]);
  const [requests, setRequests] = useState<User[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // State cho Panel Thông tin
  const [isInfoPanelOpen, setInfoPanelOpen] = useState<boolean>(false);

  // Fetch chats and messages on mount
  useEffect(() => {
    fetchChats();
    fetchFriends();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/messages/rooms");
      if (res.ok) {
        const data = await res.json();
        const chatsData: Chat[] = data.rooms.map((room: any) => ({
          id: room.id,
          name: room.name || "Chat",
          avatar: room.avatar || "https://github.com/shadcn.png",
          lastMessage: room.lastMessage || "",
          isGroup: room.isGroup || false,
          members: room.members || [],
          muted: false,
        }));
        setChats(chatsData);
        if (chatsData.length > 0) {
          setSelectedChatId(chatsData[0].id);
          fetchMessages(chatsData[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const res = await fetch(`/api/messages/rooms/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        const messages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          senderId: msg.senderId,
          senderName: msg.sender?.name,
          text: msg.content,
          timestamp: new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setAllMessages((prev) => ({ ...prev, [roomId]: messages }));
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        const friendsList: User[] = data.friends.map((friend: any) => ({
          id: friend.id,
          name: friend.name || friend.username,
          avatar: friend.avatar || friend.avatarUrl || "https://github.com/shadcn.png",
        }));
        setAllUsers(friendsList);
      }
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    }
  };

  // Lấy thông tin chat đang được chọn
  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || null;
  const currentMessages = allMessages[selectedChatId || ""] || [];

  // Hàm tiện ích
  const glassEffect =
    "bg-black/40 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

  // --- Handlers ---
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !selectedChatId) return;
    
    try {
      const res = await fetch(`/api/messages/rooms/${selectedChatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageText }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        const message: Message = {
          id: newMsg.id,
          senderId: newMsg.senderId,
          text: newMsg.content,
          timestamp: new Date(newMsg.createdAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setAllMessages((prev) => ({
          ...prev,
          [selectedChatId]: [...(prev[selectedChatId] || []), message],
        }));
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleCreateGroup = async (groupName: string, memberIds: string[]) => {
    if (!groupName.trim() || memberIds.length < 1) return;
    
    try {
      const res = await fetch("/api/messages/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          memberIds,
          isGroup: true,
        }),
      });

      if (res.ok) {
        const newRoom = await res.json();
        const newChat: Chat = {
          id: newRoom.id,
          name: newRoom.name,
          avatar: "https://github.com/shadcn.png",
          lastMessage: "Đã tạo nhóm.",
          isGroup: true,
          members: newRoom.members,
          muted: false,
        };
        setChats([newChat, ...chats]);
        setAllMessages((prev) => ({ ...prev, [newRoom.id]: [] }));
        setSelectedChatId(newRoom.id);
      }
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const handleRenameGroup = async (newName: string) => {
    if (!newName.trim() || !selectedChatId) return;
    
    try {
      const res = await fetch(`/api/messages/rooms/${selectedChatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (res.ok) {
        setChats(
          chats.map((chat) =>
            chat.id === selectedChatId ? { ...chat, name: newName } : chat
          )
        );
      }
    } catch (error) {
      console.error("Failed to rename group:", error);
    }
  };

  const handleToggleMute = (muted: boolean) => {
    if (!selectedChatId) return;
    setChats(
      chats.map((chat) =>
        chat.id === selectedChatId ? { ...chat, muted } : chat
      )
    );
  };

  const handleLeaveOrDeleteChat = async () => {
    if (!selectedChatId) return;
    
    try {
      const res = await fetch(`/api/messages/rooms/${selectedChatId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const newChats = chats.filter((chat) => chat.id !== selectedChatId);
        setChats(newChats);
        setAllMessages((prev) => {
          const newMessages = { ...prev };
          delete newMessages[selectedChatId];
          return newMessages;
        });
        setSelectedChatId(newChats.length > 0 ? newChats[0].id : null);
        setInfoPanelOpen(false);
      }
    } catch (error) {
      console.error("Failed to leave chat:", error);
    }
  };

  const handleAcceptRequest = (userId: string) => {
    // If you have friend requests endpoint, implement here
    setRequests((prev) => prev.filter((r) => r.id !== userId));
  };

  const handleDeclineRequest = (userId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== userId));
  };

  const handleAddMembers = async (memberIds: string[]) => {
    if (!selectedChatId) return;
    
    try {
      const res = await fetch(`/api/messages/rooms/${selectedChatId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds }),
      });

      if (res.ok) {
        const data = await res.json();
        setChats(
          chats.map((chat) =>
            chat.id === selectedChatId
              ? { ...chat, members: data.members }
              : chat
          )
        );
      }
    } catch (error) {
      console.error("Failed to add members:", error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedChatId) return;
    
    try {
      const res = await fetch(
        `/api/messages/rooms/${selectedChatId}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        setChats(
          chats.map((chat) =>
            chat.id === selectedChatId
              ? {
                  ...chat,
                  members: chat.members.filter((m) => m.id !== memberId),
                }
              : chat
          )
        );
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  // Lấy tên người gửi (cho nhóm chat)
  const getSender = (senderId: string): User | undefined => {
    return selectedChat?.members.find((m) => m.id === senderId);
  };

  if (loading) {
    return (
      <main className="h-screen w-screen text-white flex items-center justify-center">
        <p>Đang tải chat...</p>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen text-white p-6 transition-all duration-500">
      <div className="absolute inset-0 w-full h-full" />
      <div className="relative w-full h-full">
        {/* === Nội dung chính - Chat === */}
        <div
          className={cn(
            "absolute top-20 bottom-6 left-24 right-24",
            "flex divide-x divide-white/20",
            glassEffect,
            "overflow-hidden"
          )}
        >
          {/* --- Cột 1: Sidebar Chat (Danh sách) --- */}
          <ContactSidebar
            className={cn("")}
            chats={chats}
            requests={requests}
            selectedChatId={selectedChatId}
            onSelectChat={(chatId) => {
              setSelectedChatId(chatId);
              fetchMessages(chatId);
              setInfoPanelOpen(false);
            }}
            onCreateGroup={handleCreateGroup}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={handleDeclineRequest}
            allUsers={allUsers}
          />

          {/* --- Cột 2: Khung Chat Chi tiết --- */}
          <ChatWindow
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
              className="flex-1 w-96 max-w-sm border-l border-white/20"
              key={selectedChat.id}
              chat={selectedChat}
              allUsers={allUsers}
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
