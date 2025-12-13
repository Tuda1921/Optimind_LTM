// Tên file: app/plan/page.tsx
"use client";

import { useState, useEffect, FC, ChangeEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar"; // Component Lịch của shadcn
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog"; // MỚI
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"; // MỚI
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"; // MỚI
import { ScrollArea } from "@/components/ui/scroll-area"; // MỚI
import {
	LayoutDashboard,
	CheckSquare,
	Users,
	Trophy,
	BarChart2,
	Settings,
	Bell,
	Video,
	Music,
	Waves,
	Image as ImageIcon,
	Plus,
	Search,
	Clock,
	Tag as TagIcon,
	X,
	Pencil,
	Trash2,
	Check,
	Calendar as CalendarIcon, // MỚI
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns"; // MỚI

// --- MỚI: Định nghĩa Type ---
interface TaskTag {
	name: string;
	color: string;
}

interface Task {
	id: string;
	title: string;
	date: string; // "YYYY-MM-DD"
	time: string; // "HH:mm - HH:mm"
	tag: TaskTag;
	description: string;
	completed: boolean;
}

// --- Dữ liệu giả (Mock Data) ---
const today = new Date();
const todayString = today.toISOString().split("T")[0]; // "2025-11-16"

const mockTags: Record<string, TaskTag> = {
	project: { name: "Project", color: "bg-blue-500" },
	study: { name: "Học tập", color: "bg-green-500" },
	meeting: { name: "Họp", color: "bg-yellow-500" },
};

const mockTasksData: Task[] = [
	{
		id: "1",
		title: "Hoàn thành UI/UX Optimind",
		date: todayString,
		time: "09:00 - 11:00",
		tag: mockTags.project,
		description: "Thiết kế trang Kế hoạch học tập và trang Phòng học nhóm.",
		completed: false,
	},
	{
		id: "2",
		title: "Ôn tập Hệ phân tán",
		date: todayString,
		time: "14:00 - 15:30",
		tag: mockTags.study,
		description: "Đọc chương 3 và 4 về Giao tiếp và Đồng bộ hóa.",
		completed: false,
	},
	{
		id: "3",
		title: "Họp nhóm dự án",
		date: todayString,
		time: "16:00 - 16:30",
		tag: mockTags.meeting,
		description: "Thảo luận tiến độ và phân chia công việc tuần mới.",
		completed: true,
	},
	{
		id: "4",
		title: "Code chức năng Login",
		date: format(new Date().setDate(today.getDate() + 1), "yyyy-MM-dd"), // Ngày mai
		time: "10:00 - 12:00",
		tag: mockTags.project,
		description: "Tích hợp Supabase SSR cho trang Đăng nhập.",
		completed: false,
	},
];
// --- Kết thúc Mock Data ---

// Dữ liệu rỗng cho form
const defaultTaskValues: Omit<Task, "id" | "completed"> = {
	title: "",
	date: todayString,
	time: "09:00 - 10:00",
	tag: mockTags.study,
	description: "",
};

const TaskCalendar: FC = () => {
	// === State quản lý giao diện ===
	const [backgroundUrl, setBackgroundUrl] = useState<string>(
		"https://images.unsplash.com/photo-1542662565-7e4b66bae529?q=80&w=2070&auto=format&fit=crop"
	);

	// === State cho Lịch & Task ===
	const [tasks, setTasks] = useState<Task[]>(mockTasksData);
	const [date, setDate] = useState<Date | undefined>(today);
	const [selectedTask, setSelectedTask] = useState<Task | null>(
		tasks.find((t) => t.date === todayString) || null
	);

	// === State cho Dialog (Thêm/Sửa Task) ===
	const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
	const [currentTask, setCurrentTask] = useState<Task | null>(null); // null = Thêm mới
	const [formData, setFormData] = useState(defaultTaskValues);

	// Lọc task dựa trên ngày được chọn
	const selectedDateString = date ? format(date, "yyyy-MM-dd") : "";
	const tasksForSelectedDay = tasks.filter(
		(task) => task.date === selectedDateString
	);

	// Hàm tiện ích cho giao diện kính mờ (glassmorphism)
	const glassEffect =
		"bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

	// Hàm định dạng ngày
	const formattedDate = date
		? new Intl.DateTimeFormat("vi-VN", { dateStyle: "full" }).format(date)
		: "Vui lòng chọn một ngày";

	// --- Handlers ---

	const handleSelectDate = (selectedDate: Date | undefined) => {
		setDate(selectedDate);
		// Tự động chọn task đầu tiên của ngày mới
		const newDateString = selectedDate
			? format(selectedDate, "yyyy-MM-dd")
			: "";
		const firstTask = tasks.find((t) => t.date === newDateString) || null;
		setSelectedTask(firstTask);
	};

	// Mở Dialog để Thêm Task
	const handleOpenAddDialog = () => {
		setCurrentTask(null); // Đang ở chế độ Thêm mới
		setFormData({
			...defaultTaskValues,
			date: selectedDateString || todayString, // Lấy ngày đang chọn
		});
		setIsDialogOpen(true);
	};

	// Mở Dialog để Sửa Task
	const handleOpenEditDialog = (task: Task) => {
		setCurrentTask(task); // Đang ở chế độ Sửa
		setFormData(task);
		setIsDialogOpen(true);
	};

	// Đánh dấu hoàn thành
	const handleToggleTask = (taskId: string) => {
		setTasks((prevTasks) =>
			prevTasks.map((task) =>
				task.id === taskId
					? { ...task, completed: !task.completed }
					: task
			)
		);
		// Cập nhật cả task đang chọn
		if (selectedTask && selectedTask.id === taskId) {
			setSelectedTask((prev) =>
				prev ? { ...prev, completed: !prev.completed } : null
			);
		}
	};

	// Xóa Task
	const handleDeleteTask = (taskId: string) => {
		setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
		if (selectedTask && selectedTask.id === taskId) {
			setSelectedTask(null); // Bỏ chọn nếu task bị xóa
		}
	};

	// Lưu (Thêm mới hoặc Cập nhật)
	const handleSaveTask = () => {
		if (!formData.title) return; // Yêu cầu tiêu đề

		if (currentTask) {
			// --- Cập nhật Task ---
			const updatedTask = { ...currentTask, ...formData };
			setTasks(
				tasks.map((t) => (t.id === currentTask.id ? updatedTask : t))
			);
			setSelectedTask(updatedTask);
		} else {
			// --- Thêm Task mới ---
			const newTask: Task = {
				id: crypto.randomUUID(),
				...formData,
				completed: false,
			};
			setTasks([newTask, ...tasks]);
			// Nếu ngày mới thêm là ngày đang chọn, tự động chọn nó
			if (newTask.date === selectedDateString) {
				setSelectedTask(newTask);
			}
		}
		setIsDialogOpen(false); // Đóng Dialog
	};

	// Cập nhật Form Data
	const handleFormChange = (field: keyof typeof formData, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
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
				{/* === Nội dung chính - Quản lý Kế hoạch === */}
				<div
					className={cn(
						"absolute top-20 bottom-6 left-24 right-24", // Định vị giữa các sidebar
						"flex divide-x divide-white/20", // Layout 3 cột
						glassEffect
					)}
				>
					{/* --- Cột 1: Lịch & Filter --- */}
					<div className="flex-[0.25] p-4 flex flex-col gap-4 overflow-y-auto">
						<Button
							className="bg-white text-black hover:bg-gray-200 w-full"
							onClick={handleOpenAddDialog} // MỚI: Mở Dialog
						>
							<Plus size={18} className="mr-2" /> Thêm công việc
						</Button>
						<div className="mt-2">
							<h3 className="font-semibold mb-2">Lịch</h3>
							{/* Component Lịch từ shadcn */}
							<Calendar
								mode="single"
								selected={date}
								onSelect={handleSelectDate} // THAY ĐỔI
								className={
									cn(
										"bg-transparent",
										"p-0 m-0",
										"[&_button[aria-selected]]:bg-white/30 text-white",
										"[&_caption_button]:bg-white/10"
									)
									// "p-0 m-0", // Ghi đè style của shadcn
									// "[&_button]:bg-transparent [&_button]:text-white",
									// "[&_button:hover]:bg-white/20",
									// "[&_th]:text-white/70",
								}
							/>
						</div>
						<div className="mt-4">
							<h3 className="font-semibold mb-3">Tags</h3>
							<div className="flex flex-col gap-3">
								{/* (Logic filter có thể thêm sau) */}
								<div className="flex items-center space-x-2">
									<Checkbox
										id="tag-all"
										defaultChecked
										className="[&_svg]:text-white"
									/>
									<Label
										htmlFor="tag-all"
										className="text-sm"
									>
										Tất cả
									</Label>
								</div>
								{Object.values(mockTags).map((tag) => (
									<div
										className="flex items-center space-x-2"
										key={tag.name}
									>
										<Checkbox
											id={`tag-${tag.name}`}
											className="[&_svg]:text-white"
										/>
										<Label
											htmlFor={`tag-${tag.name}`}
											className="text-sm"
										>
											{tag.name}
										</Label>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* --- Cột 2: Danh sách Công việc --- */}
					<div className="flex-[0.45] p-4 flex flex-col">
						{/* Thanh tìm kiếm */}
						<div className="relative mb-4">
							<Search
								className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
								size={18}
							/>
							<Input
								placeholder="Tìm kiếm công việc..."
								className="bg-white/10 border-none pl-10 focus-visible:ring-1 focus-visible:ring-white/80"
							/>
						</div>
						{/* Tiêu đề ngày */}
						<h2 className="text-xl font-bold mb-3 truncate">
							{formattedDate}
						</h2>
						{/* Danh sách task (scrollable) */}
						<ScrollArea className="flex-1 -mr-4 pr-4">
							<div className="space-y-3">
								{tasksForSelectedDay.length > 0 ? (
									tasksForSelectedDay.map((task) => (
										<button
											key={task.id}
											onClick={() =>
												setSelectedTask(task)
											}
											className={cn(
												"w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors",
												"hover:bg-white/20",
												selectedTask?.id === task.id &&
													"bg-white/20",
												task.completed && "opacity-50"
											)}
										>
											<Checkbox
												checked={task.completed}
												onCheckedChange={() =>
													handleToggleTask(task.id)
												} // MỚI
												className="[&_svg]:text-white"
											/>
											<div className="flex-1">
												<p
													className={cn(
														"font-semibold",
														task.completed &&
															"line-through"
													)}
												>
													{task.title}
												</p>
												<span className="text-xs text-white/70">
													{task.time}
												</span>
											</div>
											<span
												className={cn(
													"text-xs font-medium px-2 py-0.5 rounded-full",
													task.tag.color,
													"bg-opacity-70"
												)}
											>
												{task.tag.name}
											</span>
										</button>
									))
								) : (
									<div className="h-full flex items-center justify-center text-white/50">
										<p>Không có công việc nào.</p>
									</div>
								)}
							</div>
						</ScrollArea>
					</div>

					{/* --- Cột 3: Chi tiết Công việc --- */}
					<div className="flex-[0.30] p-4 overflow-y-auto">
						{selectedTask ? (
							<div className="space-y-5">
								<h2 className="text-xl font-bold mb-4 flex justify-between items-center">
									Chi tiết
									<Button
										variant="ghost"
										size="icon"
										className="text-white/70 hover:text-white hover:bg-white/20 -mr-2"
										onClick={() => setSelectedTask(null)}
									>
										<X size={20} />
									</Button>
								</h2>
								<h3 className="text-2xl font-semibold">
									{selectedTask.title}
								</h3>

								<div className="flex items-center gap-2 text-white/80">
									<Clock size={16} />
									<span>
										{selectedTask.time} ({selectedTask.date}
										)
									</span>
								</div>

								<div className="flex items-center gap-2">
									<TagIcon
										size={16}
										className="text-white/80"
									/>
									<span
										className={cn(
											"text-sm font-medium px-3 py-1 rounded-full",
											selectedTask.tag.color,
											"bg-opacity-70"
										)}
									>
										{selectedTask.tag.name}
									</span>
								</div>

								<div>
									<h4 className="font-semibold mb-2">
										Mô tả
									</h4>
									<p className="text-sm text-white/90 bg-white/10 p-3 rounded-md">
										{selectedTask.description ||
											"Không có mô tả."}
									</p>
								</div>

								{/* Các nút hành động */}
								<div className="flex gap-3 pt-4 border-t border-white/20">
									<Button
										className="flex-1 bg-green-600 hover:bg-green-700"
										onClick={() =>
											handleToggleTask(selectedTask.id)
										} // MỚI
									>
										<Check size={18} className="mr-2" />
										{selectedTask.completed
											? "Đánh dấu Chưa làm"
											: "Hoàn thành"}
									</Button>
									<Button
										variant="outline"
										className="bg-transparent hover:bg-white/20 text-white"
										onClick={() =>
											handleOpenEditDialog(selectedTask)
										} // MỚI
									>
										<Pencil size={16} />
									</Button>
									<Button
										variant="destructive"
										className="bg-red-600/80 hover:bg-red-600"
										onClick={() =>
											handleDeleteTask(selectedTask.id)
										} // MỚI
									>
										<Trash2 size={16} />
									</Button>
								</div>
							</div>
						) : (
							<div className="h-full flex items-center justify-center text-white/50">
								<p>Chọn một công việc để xem chi tiết</p>
							</div>
						)}
					</div>

					{/* === MỚI: Dialog Thêm/Sửa Task === */}
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogContent className="bg-black/70 backdrop-blur-md border-white/20 text-white">
							<DialogHeader>
								<DialogTitle className="text-white text-2xl">
									{currentTask
										? "Chỉnh sửa Công việc"
										: "Tạo Công việc mới"}
								</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="title">
										Tên Task (Bắt buộc)
									</Label>
									<Input
										id="title"
										value={formData.title}
										onChange={(e) =>
											handleFormChange(
												"title",
												e.target.value
											)
										}
										className="bg-white/10 border-white/30"
										placeholder="Ví dụ: Hoàn thành Báo cáo"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="description">
										Nội dung (Ghi chú)
									</Label>
									<Input
										id="description"
										value={formData.description}
										onChange={(e) =>
											handleFormChange(
												"description",
												e.target.value
											)
										}
										className="bg-white/10 border-white/30"
										placeholder="Ví dụ: Trang 1-5, cần 3 biểu đồ..."
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Tag</Label>
										<Select
											value={formData.tag.name}
											onValueChange={(value: string) =>
												handleFormChange(
													"tag",
													mockTags[
														value.toLowerCase()
													]
												)
											}
										>
											<SelectTrigger className="bg-white/10 border-white/30">
												<SelectValue placeholder="Chọn tag" />
											</SelectTrigger>
											<SelectContent className="bg-black/70 backdrop-blur-md border-white/20 text-white">
												{Object.values(mockTags).map(
													(tag) => (
														<SelectItem
															key={tag.name}
															value={tag.name}
														>
															{tag.name}
														</SelectItem>
													)
												)}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>Ngày</Label>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant={"outline"}
													className={cn(
														"w-full justify-start text-left font-normal bg-white/10 border-white/30",
														!formData.date &&
															"text-gray-300"
													)}
												>
													<CalendarIcon className="mr-2 h-4 w-4" />
													{formData.date ? (
														format(
															parse(
																formData.date,
																"yyyy-MM-dd",
																new Date()
															),
															"PPP"
														)
													) : (
														<span>Chọn ngày</span>
													)}
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="w-auto p-0 bg-black/70 backdrop-blur-md border-white/20 text-white"
												align="start"
											>
												<Calendar
													mode="single"
													selected={parse(
														formData.date,
														"yyyy-MM-dd",
														new Date()
													)}
													onSelect={(newDate) =>
														handleFormChange(
															"date",
															newDate
																? format(
																		newDate,
																		"yyyy-MM-dd"
																  )
																: ""
														)
													}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="time">
										Thời gian (VD: 09:00 - 11:00)
									</Label>
									<Input
										id="time"
										value={formData.time}
										onChange={(e) =>
											handleFormChange(
												"time",
												e.target.value
											)
										}
										className="bg-white/10 border-white/30"
										placeholder="09:00 - 11:00"
									/>
								</div>
							</div>
							<DialogFooter>
								<DialogClose asChild>
									<Button variant="ghost">Hủy</Button>
								</DialogClose>
								<Button onClick={handleSaveTask}>Lưu</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</main>
	);
};

export default TaskCalendar;
