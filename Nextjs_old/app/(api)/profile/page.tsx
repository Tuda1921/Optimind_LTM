// Tên file: app/profile/page.tsx
"use client";

import { useState, FC, MouseEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Cần cho form
import { Label } from "@/components/ui/label"; // Cần cho form
import { Textarea } from "@/components/ui/textarea"; // Cần cho bio
import { Switch } from "@/components/ui/switch"; // Cần cho cài đặt chia sẻ
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuCheckboxItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	User, // Icon chính của trang
	Pencil, // Icon chỉnh sửa
	Eye, // Icon chia sẻ
	MapPin, // Icon Vị trí (Mặc định)
	Link as LinkIcon, // Icon Website (Mặc định)
	Clock, // Icon Thời gian
	Brain, // Icon Tập trung
	Plus, // Icon Thêm
	Trash2, // Icon Xóa
	Check, // Icon Lưu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// --- MỚI: Định nghĩa Type cho Trường tùy chỉnh ---
interface UserField {
	id: string;
	label: string;
	value: string;
	isPublic: boolean; // Có hiển thị công khai không
	icon?: React.ReactNode;
}

// --- Component phụ cho Cài đặt Chia sẻ ---
const SettingItem: FC<{ id: string; label: string; description: string }> = ({
	id,
	label,
	description,
}) => {
	return (
		<div className="flex flex-row items-center justify-between rounded-lg p-4 bg-white/5">
			<div className="space-y-0.5">
				<Label htmlFor={id} className="text-base text-white">
					{label}
				</Label>
				<p className="text-sm text-gray-300">{description}</p>
			</div>
			<Switch id={id} defaultChecked />
		</div>
	);
};

export default function ProfilePage() {
	// === State quản lý giao diện ===
	const [backgroundUrl] = useState<string>(
		"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop"
	);

	// === State cho Hồ sơ ===
	const [name, setName] = useState<string>("Người dùng Optimind");
	const [bio, setBio] = useState<string>(
		"Mình là sinh viên và đang cố gắng học tập mỗi ngày!"
	);
	const [studyTime] = useState<string>("120 giờ");
	const [focusScore] = useState<string>("88%");

	// MỚI: State cho các trường tùy chỉnh
	const [customFields, setCustomFields] = useState<UserField[]>([
		{
			id: "loc",
			label: "Vị trí",
			value: "Hanoi, Vietnam",
			isPublic: true,
			icon: <MapPin className="w-5 h-5 text-gray-400" />,
		},
		{
			id: "web",
			label: "Trang web",
			value: "https://optimind.app",
			isPublic: true,
			icon: <LinkIcon className="w-5 h-5 text-gray-400" />,
		},
		{
			id: "gpa",
			label: "GPA",
			value: "3.5/4.0",
			isPublic: false,
			icon: null,
		},
	]);

	// MỚI: State cho chế độ Chỉnh sửa
	const [isEditing, setIsEditing] = useState<boolean>(false);

	// MỚI: State tạm thời cho form (khi chỉnh sửa)
	const [tempName, setTempName] = useState(name);
	const [tempBio, setTempBio] = useState(bio);
	const [tempFields, setTempFields] = useState<UserField[]>(customFields);

	// Hàm tiện ích (GIỮ NGUYÊN)
	const glassEffect =
		"bg-black/30 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

	// --- MỚI: Handlers ---
	const handleStartEdit = () => {
		// Tải dữ liệu hiện tại vào form tạm
		setTempName(name);
		setTempBio(bio);
		setTempFields(customFields); // Deep copy fields
		setIsEditing(true);
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
	};

	const handleSaveEdit = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		// Lưu dữ liệu từ temp vào state chính
		setName(tempName);
		setBio(tempBio);
		setCustomFields(tempFields.filter((f) => f.value.trim() !== "")); // Xóa các trường trống
		setIsEditing(false);
	};

	// Logic quản lý Custom Fields
	const handleAddField = () => {
		// MỚI: Khi thêm, cập nhật state tạm (tempFields)
		setTempFields((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				label: "Trường mới",
				value: "",
				isPublic: false,
				icon: <MapPin className="w-5 h-5 text-gray-400" />, // Mặc định icon MapPin
			},
		]);
	};

	const handleUpdateFieldVisibility = (id: string, isPublic: boolean) => {
		setCustomFields((prev) =>
			prev.map((field) =>
				field.id === id ? { ...field, isPublic: isPublic } : field
			)
		);
	};

	// Hàm này được dùng trong chế độ chỉnh sửa (Edit Mode)
	const handleUpdateField = (
		id: string,
		key: "label" | "value" | "isPublic",
		value: any
	) => {
		setTempFields((prev) =>
			prev.map((field) =>
				field.id === id ? { ...field, [key]: value } : field
			)
		);
	};

	const handleDeleteField = (id: string) => {
		// Nếu đang ở chế độ xem, xóa khỏi customFields chính
		if (!isEditing) {
			setCustomFields((prev) => prev.filter((field) => field.id !== id));
		} else {
			// Nếu đang ở chế độ chỉnh sửa, xóa khỏi tempFields
			setTempFields((prev) => prev.filter((field) => field.id !== id));
		}
	};

	return (
		<main className="h-screen w-screen text-white p-6 transition-all duration-500">
			<div
				className="absolute inset-0 w-full h-full"
				style={{
					backgroundImage: `url(${backgroundUrl})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			/>
			<div className="relative w-full h-full">
				{/* === NỘI DUNG TRANG HỒ SƠ (THAY THẾ) === */}
				<section
					className={cn(
						"absolute w-[800px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-6 flex flex-col gap-6",
						glassEffect
					)}
				>
					<h2 className="text-3xl font-bold">Hồ Sơ Của Bạn</h2>

					<Tabs defaultValue="profile" className="w-full">
						{/* Tabs List: Chọn Thông tin / Chia sẻ */}
						<TabsList className="grid w-full grid-cols-2 bg-white/10 text-white">
							<TabsTrigger value="profile">
								<User className="w-4 h-4 mr-2" />
								Thông tin cá nhân
							</TabsTrigger>
							<TabsTrigger value="sharing">
								<Eye className="w-4 h-4 mr-2" />
								Cài đặt chia sẻ
							</TabsTrigger>
						</TabsList>

						{/* Nội dung Tab 1: Chỉnh sửa Hồ sơ */}
						<TabsContent value="profile" className="mt-6">
							<div className="flex flex-col md:flex-row gap-8">
								{/* Cột trái: Avatar và Nút hành động */}
								<div className="flex flex-col items-center gap-4">
									<div className="relative">
										<Avatar className="h-40 w-40 border-4 border-white/30">
											<AvatarImage
												src="https://github.com/shadcn.png"
												alt="@shadcn"
											/>
											<AvatarFallback className="text-5xl">
												U
											</AvatarFallback>
										</Avatar>
										{/* Chỉ cho phép sửa avatar khi ở chế độ Edit */}
										{isEditing && (
											<Button
												variant="outline"
												size="icon"
												className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-white/20 border-white/30 hover:bg-white/30"
											>
												<Pencil className="h-5 w-5" />
											</Button>
										)}
									</div>
									{isEditing && (
										<Button
											variant="destructive"
											size="sm"
											className="bg-red-600/80 hover:bg-red-600"
										>
											Xóa Avatar
										</Button>
									)}

									{/* MỚI: Nút Chỉnh sửa & Tùy chỉnh hiển thị (Trong chế độ Xem) */}
									{!isEditing && (
										<>
											<Button
												onClick={handleStartEdit}
												className="w-full max-w-[160px] mt-4"
											>
												<Pencil className="w-4 h-4 mr-2" />
												Chỉnh sửa
											</Button>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="outline"
														className="w-full max-w-[160px] bg-transparent hover:bg-white/20"
													>
														<Eye className="w-4 h-4 mr-2" />
														Tùy chỉnh hiển thị
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent className="bg-black/70 backdrop-blur-md border-white/20 text-white">
													{customFields.map(
														(field) => (
															<DropdownMenuCheckboxItem
																key={`public-${field.id}`}
																checked={
																	field.isPublic
																}
																onCheckedChange={(
																	checked
																) =>
																	handleUpdateFieldVisibility(
																		field.id,
																		checked
																	)
																}
															>
																{field.label}
															</DropdownMenuCheckboxItem>
														)
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</>
									)}
								</div>

								{/* Cột phải: Form thông tin (với 2 chế độ) */}
								<div className="flex-1">
									{isEditing ? (
										// --- CHẾ ĐỘ CHỈNH SỬA (EDIT MODE) ---
										<form className="space-y-4">
											<div className="space-y-2">
												<Label
													htmlFor="name"
													className="text-gray-300"
												>
													Họ và Tên
												</Label>
												<Input
													id="name"
													value={tempName}
													onChange={(e) =>
														setTempName(
															e.target.value
														)
													}
													className="bg-white/10 border-white/20 placeholder:text-gray-400"
												/>
											</div>
											<div className="space-y-2">
												<Label
													htmlFor="bio"
													className="text-gray-300"
												>
													Giới thiệu
												</Label>
												<Textarea
													id="bio"
													value={tempBio}
													onChange={(e) =>
														setTempBio(
															e.target.value
														)
													}
													placeholder="Viết vài dòng về bạn..."
													className="bg-white/10 border-white/20 placeholder:text-gray-400"
													rows={3}
												/>
											</div>

											<Separator className="bg-white/20 my-6" />

											{/* MỚI: QUẢN LÝ CÁC TRƯỜNG TÙY CHỈNH */}
											<h4 className="text-lg font-semibold text-white mb-2 flex justify-between items-center">
												Thông tin tùy chỉnh
												{/* Nút Thêm Trường */}
												<Button
													type="button" // FIX: type="button" để ngăn refresh
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-green-400 hover:bg-white/20"
													onClick={handleAddField}
												>
													<Plus className="w-4 h-4" />
												</Button>
											</h4>

											{/* Danh sách các trường có sẵn */}
											<div className="space-y-2">
												{tempFields.map((field) => (
													<div
														key={field.id}
														className="flex items-center gap-3"
													>
														<Input
															value={field.label}
															onChange={(e) =>
																handleUpdateField(
																	field.id,
																	"label",
																	e.target
																		.value
																)
															}
															className="w-1/3 bg-white/10 border-white/30 text-sm"
															placeholder="Tên trường..."
														/>
														<Input
															value={field.value}
															onChange={(e) =>
																handleUpdateField(
																	field.id,
																	"value",
																	e.target
																		.value
																)
															}
															className="flex-1 bg-white/10 border-white/30 text-sm"
															placeholder="Giá trị..."
														/>
														{/* Nút Xóa */}
														<Button
															type="button" // FIX: type="button" để ngăn refresh
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-red-400 hover:bg-red-900/50"
															onClick={() =>
																handleDeleteField(
																	field.id
																)
															}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												))}
											</div>

											<div className="flex gap-4 pt-4 border-t border-white/20">
												<Button
													// THAY ĐỔI: Thêm type="submit" hoặc gọi hàm handleSaveEdit()
													onClick={handleSaveEdit}
													className="bg-blue-600 hover:bg-blue-700"
													type="submit"
												>
													Lưu thay đổi
												</Button>
												<Button
													type="button"
													variant="ghost"
													onClick={handleCancelEdit}
												>
													Hủy
												</Button>
											</div>
										</form>
									) : (
										// --- CHẾ ĐỘ XEM (VIEW MODE) ---
										<div className="space-y-6">
											<div>
												{/* THAY ĐỔI: Bỏ Label */}
												<p className="text-2xl font-semibold text-white">
													{name}
												</p>
											</div>
											<div>
												{/* THAY ĐỔI: Bỏ Label */}
												<p className="text-base text-gray-200 italic">
													{bio ||
														"Chưa cập nhật giới thiệu."}
												</p>
											</div>

											<Separator className="bg-white/20" />

											{/* MỚI: Thông tin thống kê (mặc định) */}
											<div className="grid grid-cols-2 gap-4">
												<div className="flex items-center gap-2">
													<Clock className="w-5 h-5 text-gray-400" />
													<div>
														<Label className="text-sm text-gray-400">
															Thời gian học
														</Label>
														<p className="text-lg font-semibold text-white">
															{studyTime}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<Brain className="w-5 h-5 text-gray-400" />
													<div>
														<Label className="text-sm text-gray-400">
															Tập trung TB
														</Label>
														<p className="text-lg font-semibold text-white">
															{focusScore}
														</p>
													</div>
												</div>
											</div>

											<Separator className="bg-white/20" />

											{/* MỚI: Hiển thị các trường tùy chỉnh (chỉ những trường public) */}
											{customFields
												.filter(
													(f) =>
														f.isPublic &&
														f.value.trim() !== ""
												)
												.map((field) => (
													<div
														className="flex items-center justify-between py-1 group"
														key={field.id}
													>
														<div className="flex items-center gap-2">
															{/* Icon đã được truyền trong data */}
															{field.icon || (
																<MapPin className="w-5 h-5 text-gray-400" />
															)}
															<div>
																<Label className="text-sm text-gray-400">
																	{
																		field.label
																	}
																</Label>
																<p className="text-base text-gray-200">
																	{
																		field.value
																	}
																</p>
															</div>
														</div>
														{/* Nút chỉnh sửa và xóa riêng */}
														<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-gray-400 hover:bg-white/20"
																onClick={() =>
																	handleUpdateFieldVisibility(
																		field.id,
																		false
																	)
																} // Tắt hiển thị
															>
																<Eye className="w-4 h-4" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-red-400 hover:bg-red-900/50"
																onClick={() =>
																	handleDeleteField(
																		field.id
																	)
																}
															>
																<Trash2 className="w-4 h-4" />
															</Button>
														</div>
													</div>
												))}
										</div>
									)}
								</div>
							</div>
						</TabsContent>

						{/* Nội dung Tab 2: Cài đặt Chia sẻ */}
						<TabsContent value="sharing" className="mt-6">
							<div className="flex flex-col gap-4">
								<SettingItem
									id="share-time"
									label="Hiển thị tổng thời gian học"
									description="Cho phép người khác xem tổng thời gian học của bạn trên BXH."
								/>
								<Separator className="bg-white/20" />
								<SettingItem
									id="share-focus"
									label="Hiển thị độ tập trung"
									description="Cho phép người khác xem điểm tập trung trung bình của bạn."
								/>
								<Separator className="bg-white/20" />
								<SettingItem
									id="share-pet"
									label="Chia sẻ kho thú cưng (Pet)"
									description="Bạn bè có thể vào xem và tương tác với pet của bạn."
								/>
								<Separator className="bg-white/20" />
								<SettingItem
									id="share-status"
									label="Hiển thị trạng thái online"
									description="Cho phép bạn bè thấy khi nào bạn đang online hoặc đang học."
								/>
							</div>
						</TabsContent>
					</Tabs>
				</section>
			</div>
		</main>
	);
}
