"use client";

import { FC, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
	VideoOff,
	Music,
	Waves,
	Image as ImageIcon,
	X,
	Shield,
	KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// === Interfaces và Types ===
interface SettingItemProps {
	id: string;
	label: string;
	description: string;
}

interface SettingsState {
	backgroundUrl: string;
	isCameraOn: boolean;
}

interface PasswordFormState {
	oldPassword: string;
	newPassword: string;
	confirmPassword: string;
}

// Component Setting Item
function SettingItem({ id, label, description }: SettingItemProps) {
	return (
		<div className="flex flex-row items-center justify-between rounded-lg p-4">
			<div className="space-y-0.5">
				<Label htmlFor={id} className="text-base text-white">
					{label}
				</Label>
				<p className="text-sm text-gray-300">{description}</p>
			</div>
			<Switch id={id} />
		</div>
	);
}

export default function SettingsPage() {
	// === State quản lý giao diện ===
	const [settings, setSettings] = useState<SettingsState>({
		backgroundUrl:
			"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop",
		isCameraOn: false,
	});

	const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
		oldPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	// Hàm tiện ích
	const glassEffect: string =
		"bg-black/30 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

	// Event handlers
	const handlePasswordChange = (
		field: keyof PasswordFormState,
		value: string
	): void => {
		setPasswordForm((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSavePassword = (): void => {
		// TODO: Thêm logic xử lý lưu mật khẩu
		console.log("Password form:", passwordForm);
	};

	return (
		<main
			className="h-screen w-screen text-white p-6 transition-all duration-500"
			style={{
				backgroundImage: `url(${settings.backgroundUrl})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			<div className="relative w-full h-full">
				{/* === NỘI DUNG TRANG CÀI ĐẶT === */}
				<section
					className={cn(
						"absolute w-[700px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-6 flex flex-col gap-4",
						glassEffect
					)}
				>
					<h2 className="text-3xl font-bold">Cài Đặt</h2>

					<Tabs defaultValue="notifications" className="w-full">
						{/* Tabs List */}
						<TabsList className="grid w-full grid-cols-2 bg-white/10 text-white">
							<TabsTrigger value="notifications">
								<Bell className="w-4 h-4 mr-2" />
								Thông báo
							</TabsTrigger>
							<TabsTrigger value="security">
								<Shield className="w-4 h-4 mr-2" />
								Bảo mật
							</TabsTrigger>
						</TabsList>

						{/* Tab 1: Thông báo */}
						<TabsContent value="notifications" className="mt-6">
							<div className="flex flex-col gap-4">
								<SettingItem
									id="noti-session"
									label="Thông báo phiên học"
									description="Nhắc nhở khi đến giờ học hoặc giờ nghỉ."
								/>
								<Separator className="bg-white/20" />
								<SettingItem
									id="noti-focus"
									label="Thông báo độ tập trung"
									description="Cảnh báo khi phát hiện độ tập trung thấp."
								/>
								<Separator className="bg-white/20" />
								<SettingItem
									id="noti-friend"
									label="Thông báo từ bạn bè"
									description="Nhận thông báo tin nhắn, lời mời kết bạn."
								/>
							</div>
						</TabsContent>

						{/* Tab 2: Bảo mật */}
						<TabsContent value="security" className="mt-6">
							<div className="flex flex-col gap-6">
								<h3 className="text-xl font-semibold">
									Đổi mật khẩu
								</h3>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label
											htmlFor="old-pass"
											className="text-gray-300"
										>
											Mật khẩu cũ
										</Label>
										<Input
											id="old-pass"
											type="password"
											className="bg-white/10 border-white/20 placeholder:text-gray-400"
											placeholder="Nhập mật khẩu cũ của bạn"
											value={passwordForm.oldPassword}
											onChange={(e) =>
												handlePasswordChange(
													"oldPassword",
													e.target.value
												)
											}
										/>
									</div>
									<div className="space-y-2">
										<Label
											htmlFor="new-pass"
											className="text-gray-300"
										>
											Mật khẩu mới
										</Label>
										<Input
											id="new-pass"
											type="password"
											className="bg-white/10 border-white/20 placeholder:text-gray-400"
											placeholder="Nhập mật khẩu mới"
											value={passwordForm.newPassword}
											onChange={(e) =>
												handlePasswordChange(
													"newPassword",
													e.target.value
												)
											}
										/>
									</div>
									<div className="space-y-2">
										<Label
											htmlFor="confirm-pass"
											className="text-gray-300"
										>
											Xác nhận mật khẩu mới
										</Label>
										<Input
											id="confirm-pass"
											type="password"
											className="bg-white/10 border-white/20 placeholder:text-gray-400"
											placeholder="Nhập lại mật khẩu mới"
											value={passwordForm.confirmPassword}
											onChange={(e) =>
												handlePasswordChange(
													"confirmPassword",
													e.target.value
												)
											}
										/>
									</div>
								</div>
								<Button
									onClick={handleSavePassword}
									className="self-start bg-blue-600 hover:bg-blue-700"
								>
									<KeyRound className="w-4 h-4 mr-2" />
									Lưu thay đổi
								</Button>
							</div>
						</TabsContent>
					</Tabs>
				</section>
			</div>
		</main>
	);
}
