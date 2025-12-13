// Tên file: app/components/TaskListWidget.tsx
"use client";

import { useState, FC, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Plus,
	X,
	Trash2,
	MoreVertical, // MỚI: Icon 3 chấm
	Pencil, // MỚI: Icon Edit
	Check, // MỚI: Icon Lưu
} from "lucide-react";
import { cn } from "@/lib/utils";

// Hàm tiện ích
const glassEffect =
	"bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg";

// MỚI: Cập nhật Định nghĩa kiểu Task
interface Task {
	id: string;
	text: string;
	note: string; // Thêm ghi chú
	completed: boolean;
}

// Định nghĩa Props
interface TaskListWidgetProps {
	show: boolean;
	onClose: () => void;
}

// MỚI: Dữ liệu ban đầu
const initialTasks: Task[] = [
	{
		id: "1",
		text: "Làm bài tập C++ (Tree)",
		note: "Chương 5, bài 1-3",
		completed: false,
	},
	{ id: "2", text: "Viết báo cáo Optimind", note: "", completed: true },
	{
		id: "3",
		text: "Ôn tập chương 3 Giải tích",
		note: "Tập trung vào tích phân",
		completed: false,
	},
];

// Component Task List
const TaskListWidget: FC<TaskListWidgetProps> = ({ show, onClose }) => {
	// State quản lý tasks
	const [tasks, setTasks] = useState<Task[]>(initialTasks);
	const [newTaskText, setNewTaskText] = useState<string>("");

	// MỚI: State cho việc chỉnh sửa
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
	const [editingText, setEditingText] = useState<string>("");
	const [editingNote, setEditingNote] = useState<string>("");

	// Hàm thêm Task
	const handleAddTask = () => {
		if (newTaskText.trim() === "") return;
		const newTask: Task = {
			id: crypto.randomUUID(),
			text: newTaskText,
			note: "", // Ghi chú ban đầu trống
			completed: false,
		};
		setTasks([newTask, ...tasks]); // Thêm vào đầu danh sách
		setNewTaskText(""); // Xóa input
	};

	// Hàm xóa Task
	const handleDeleteTask = (id: string) => {
		setTasks(tasks.filter((task) => task.id !== id));
	};

	// Hàm toggle Task
	const handleToggleTask = (id: string) => {
		setTasks(
			tasks.map((task) =>
				task.id === id ? { ...task, completed: !task.completed } : task
			)
		);
	};

	// MỚI: Bắt đầu chỉnh sửa
	const handleStartEdit = (task: Task) => {
		setEditingTaskId(task.id);
		setEditingText(task.text);
		setEditingNote(task.note);
	};

	// MỚI: Hủy chỉnh sửa
	const handleCancelEdit = () => {
		setEditingTaskId(null);
		setEditingText("");
		setEditingNote("");
	};

	// MỚI: Lưu chỉnh sửa
	const handleSaveEdit = (id: string) => {
		setTasks(
			tasks.map((task) =>
				task.id === id
					? { ...task, text: editingText, note: editingNote }
					: task
			)
		);
		handleCancelEdit(); // Reset state
	};

	if (!show) {
		return null; // Ẩn component nếu show={false}
	}

	return (
		<div
			className={cn(
				"w-100 h-full max-h-90 flex flex-col", // Tăng chiều cao 1 chút
				glassEffect,
				"animate-in fade-in zoom-in-95"
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between p-3 border-b border-white/10">
				<p className="text-lg font-semibold">Tasks</p>
				<div className="flex gap-1">
					{/* Nút X để đóng */}
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 rounded-full hover:bg-red-500/30"
						onClick={onClose} // Gọi prop onClose
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Khu vực nhập Task mới */}
			<div className="flex gap-2 p-3 border-b border-white/10">
				<Input
					placeholder="Thêm task mới..."
					className="bg-white/10 border-white/30 h-9 text-sm"
					value={newTaskText}
					onChange={(e) => setNewTaskText(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
				/>
				<Button
					size="icon"
					className="h-9 w-9 shrink-0"
					onClick={handleAddTask}
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>

			{/* Danh sách Tasks */}
			<ScrollArea className="flex-1 p-3 overflow-hidden">
				<div className="flex flex-col gap-3">
					{tasks.map((task) => (
						<div
							key={task.id}
							className="flex items-center gap-3 group w-full"
						>
							{editingTaskId === task.id ? (
								// --- CHẾ ĐỘ EDIT (INLINE) ---
								<div className="flex-1 flex flex-col gap-2">
									<Input
										value={editingText}
										onChange={(
											e: ChangeEvent<HTMLInputElement>
										) => setEditingText(e.target.value)}
										className="h-8 text-sm bg-white/20"
										placeholder="Tên task..."
									/>
									<Input
										value={editingNote}
										onChange={(
											e: ChangeEvent<HTMLInputElement>
										) => setEditingNote(e.target.value)}
										className="h-8 text-xs bg-white/10"
										placeholder="Thêm ghi chú..."
									/>
									<div className="flex gap-2 justify-end">
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-gray-300 hover:text-white"
											onClick={handleCancelEdit}
										>
											<X className="h-4 w-4" />
										</Button>
										<Button
											size="icon"
											className="h-7 w-7 bg-green-500 hover:bg-green-600"
											onClick={() =>
												handleSaveEdit(task.id)
											}
										>
											<Check className="h-4 w-4" />
										</Button>
									</div>
								</div>
							) : (
								// --- CHẾ ĐỘ HIỂN THỊ ---
								<>
									<Checkbox
										id={task.id}
										checked={task.completed}
										onCheckedChange={() =>
											handleToggleTask(task.id)
										}
										className="mt-1" // Căn checkbox với text
									/>
									<div className="flex-1 space-y-0.5">
										<label
											htmlFor={task.id}
											className={cn(
												"text-sm font-medium leading-none cursor-pointer",
												task.completed
													? "line-through text-gray-400"
													: "text-white"
											)}
										>
											{task.text}
										</label>
										{/* MỚI: Hiển thị ghi chú */}
										{task.note && (
											<p className="text-xs text-gray-400">
												{task.note}
											</p>
										)}
									</div>
									{/* THAY ĐỔI: Nút 3 chấm (Dropdown) */}
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white"
											>
												<MoreVertical className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="bg-black/70 backdrop-blur-md border-white/20 text-white">
											<DropdownMenuItem
												onClick={() =>
													handleStartEdit(task)
												}
												className="cursor-pointer"
											>
												<Pencil className="mr-2 h-4 w-4" />
												Chỉnh sửa
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() =>
													handleDeleteTask(task.id)
												}
												className="cursor-pointer text-red-400 focus:text-red-400"
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Xóa
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</>
							)}
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
};

export default TaskListWidget;
