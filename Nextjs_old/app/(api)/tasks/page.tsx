// Tên file: app/tasks/page.tsx
"use client";

import React, { useState, FC, useMemo, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
	Plus,
	Flag,
	CalendarDays,
	AlignLeft,
	GripVertical, // MỚI
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// --- DND-Kit Imports ---
import {
	DndContext,
	PointerSensor,
	useSensor,
	useSensors,
	DragOverlay,
	DragStartEvent,
	DragEndEvent,
	DragOverEvent,
	closestCorners,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	useSortable,
	verticalListSortingStrategy,
	horizontalListSortingStrategy, // MỚI
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";

// --- (Giả sử các component UI đã được import) ---
// import NavSidebar from "@/components/NavSidebar";
// import UserHeader from "@/components/UserHeader";
// import ControlToolbar from "@/components/ControlToolbar";

// --- MỚI: Định nghĩa Types ---
type Priority = "high" | "medium" | "low";

interface Task {
	id: string;
	columnId: string;
	title: string;
	description?: string;
	tags?: string[];
	dueDate?: Date;
	priority: Priority;
}

interface Column {
	id: string;
	title: string;
}

type Tasks = Record<string, Task[]>; // { [key: string]: Task[] }

// --- Dữ liệu giả (Mock Data) CẬP NHẬT ---
const mockColumns: Column[] = [
	{ id: "todo", title: "To Do" },
	{ id: "onProgress", title: "In Progress" },
	{ id: "complete", title: "Complete" },
	{ id: "overdue", title: "Overdue" }, // MỚI
];

const initialTasks: Tasks = {
	todo: [
		{
			id: "1",
			columnId: "todo",
			title: "Vẽ phác thảo UI/UX cho Optimind",
			description: "Dùng Figma, tập trung vào trang học tập.",
			tags: ["UI/UX", "Figma"],
			dueDate: new Date(2025, 10, 20),
			priority: "high",
		},
		{
			id: "2",
			columnId: "todo",
			title: "Nghiên cứu về WebRTC",
			description: "Tìm hiểu cách hoạt động của data channels.",
			tags: ["Research"],
			priority: "medium",
		},
		// MỚI: Task quá hạn để test
		{
			id: "6",
			columnId: "todo",
			title: "Task test quá hạn",
			description: "Task này đáng lẽ phải ở cột Overdue.",
			tags: ["Test"],
			dueDate: new Date(2020, 1, 1), // Đã quá hạn
			priority: "low",
		},
	],
	onProgress: [
		{
			id: "3",
			columnId: "onProgress",
			title: "Code trang Pomodoro",
			description: "Tích hợp logic timer và tasks.",
			tags: ["Dev", "React"],
			dueDate: new Date(2025, 10, 18),
			priority: "high",
		},
	],
	complete: [
		{
			id: "4",
			columnId: "complete",
			title: "Thiết kế CSDL",
			description: "Sử dụng Supabase tables.",
			tags: ["DB", "Supabase"],
			priority: "low",
		},
	],
	overdue: [
		// MỚI
		{
			id: "5",
			columnId: "overdue",
			title: "Nộp báo cáo tuần 1",
			description: "",
			tags: [],
			dueDate: new Date(2020, 0, 1), // Đã quá hạn
			priority: "high",
		},
	],
};
// --- Kết thúc Mock Data ---

// Dữ liệu mặc định cho Task mới
const defaultNewTask: Omit<Task, "id" | "columnId"> = {
	title: "",
	description: "",
	tags: [],
	priority: "medium",
	dueDate: undefined,
};

// --- Component TaskCard (Cập nhật) ---
interface TaskCardProps {
	task: Task;
	isOverlay?: boolean;
}

const TaskCard: FC<TaskCardProps> = ({ task, isOverlay = false }) => {
	const {
		setNodeRef,
		attributes,
		listeners,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: task.id,
		data: {
			type: "Task",
			task,
		},
	});

	const style = {
		transition,
		transform: CSS.Transform.toString(transform),
	};

	const priorityColors: Record<Priority, string> = {
		high: "bg-red-500",
		medium: "bg-yellow-500",
		low: "bg-green-500",
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={cn(
				"bg-black/40 p-3 rounded-lg shadow-md flex gap-2 cursor-grab active:cursor-grabbing",
				isOverlay && "opacity-75 shadow-2xl scale-105",
				isDragging && "opacity-30"
			)}
		>
			{/* Thanh Priority */}
			<div
				className={cn(
					"w-1.5 rounded-full",
					priorityColors[task.priority]
				)}
			/>

			<div className="flex-1 space-y-2">
				{/* Tiêu đề */}
				<p className="font-semibold text-white">{task.title}</p>

				{/* Nội dung */}
				{task.description && (
					<p className="text-sm text-gray-300">{task.description}</p>
				)}

				{/* Hạn */}
				{task.dueDate && (
					<div
						className={cn(
							"flex items-center gap-2 text-sm",
							task.columnId !== "complete" &&
								task.dueDate < new Date()
								? "text-red-400"
								: "text-gray-300"
						)}
					>
						<CalendarDays className="w-4 h-4" />
						<span>{format(task.dueDate, "dd/MM/yyyy")}</span>
					</div>
				)}

				{/* Tags */}
				{task.tags && task.tags.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{task.tags.map((tag) => (
							<Badge
								key={tag}
								variant="secondary"
								className="text-xs bg-white/20 text-white"
							>
								{tag}
							</Badge>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

// --- Component KanbanColumn (Cập nhật) ---
interface KanbanColumnProps {
	column: Column;
	tasks: Task[];
	onAddTask: (columnId: string) => void;
}

const KanbanColumn: FC<KanbanColumnProps> = ({ column, tasks, onAddTask }) => {
	// MỚI: Thêm useSortable cho Cột
	const {
		setNodeRef,
		attributes,
		listeners,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: column.id,
		data: {
			type: "Column",
			column,
		},
	});

	const style = {
		transition,
		transform: CSS.Transform.toString(transform),
	};

	return (
		<div
			ref={setNodeRef} // Gắn ref dnd
			style={style} // Áp dụng style dnd
			className={cn(
				"w-80 h-full flex flex-col shrink-0", // Kích thước cố định, chống co
				isDragging && "opacity-50"
			)}
		>
			{/* Header cột */}
			<div
				{...attributes} // Gắn attributes dnd
				{...listeners} // Gắn listeners dnd (để kéo cột)
				className={cn(
					"flex-shrink-0 p-4 rounded-t-lg flex justify-between items-center cursor-grab",
					"bg-black/20"
				)}
			>
				{/* THAY ĐỔI: Giảm cỡ chữ tiêu đề cột */}
				<h3 className="font-semibold text-white">{column.title}</h3>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-gray-300 hover:text-white"
					onClick={(e) => {
						e.stopPropagation(); // Ngăn dnd-kit bắt sự kiện click
						onAddTask(column.id);
					}}
				>
					<Plus size={16} />
				</Button>
			</div>

			{/* Nội dung cột */}
			<ScrollArea
				className={cn(
					"flex-1 p-4 rounded-b-lg overflow-hidden max-h-85",
					"bg-white/30"
				)}
			>
				<SortableContext
					items={tasks.map((t) => t.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="flex flex-col gap-3">
						{tasks.map((task) => (
							<TaskCard key={task.id} task={task} />
						))}
					</div>
				</SortableContext>
				<ScrollBar orientation="vertical" />
			</ScrollArea>
		</div>
	);
};

// --- Component Trang Chính ---
export default function TaskBoardPage() {
	// === State giao diện ===
	const [backgroundUrl, setBackgroundUrl] = useState<string>(
		"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop"
	);
	// (Các state UI khác)
	// ...

	// === State cho Kanban ===
	const [columns, setColumns] = useState<Column[]>(mockColumns);
	const [tasks, setTasks] = useState<Tasks>(initialTasks);

	// State kéo thả
	const [activeTask, setActiveTask] = useState<Task | null>(null);
	const [activeColumn, setActiveColumn] = useState<Column | null>(null); // MỚI

	// === State cho Modal "Add Task" ===
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const [newTaskData, setNewTaskData] =
		useState<Omit<Task, "id" | "columnId">>(defaultNewTask);
	const [newColumnId, setNewColumnId] = useState<string>("todo");

	// Cài đặt Sensors cho DND-Kit
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 10,
			},
		})
	);

	// Hàm tiện ích
	const glassEffect =
		"bg-black/30 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

	// MỚI: Chuyển ID cột thành một mảng (useMemo) để dnd-kit dùng
	const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

	// MỚI: Logic kiểm tra Task quá hạn (chạy 1 lần khi tải)
	useEffect(() => {
		const checkOverdueTasks = () => {
			const now = new Date();
			let newTasksState = { ...tasks };
			let hasChanges = false;

			const columnsToScan = ["todo", "onProgress"];

			columnsToScan.forEach((colId) => {
				if (!newTasksState[colId]) return;

				const overdueTasks = newTasksState[colId].filter(
					(t) => t.dueDate && t.dueDate < now
				);

				if (overdueTasks.length > 0) {
					hasChanges = true;
					// Lọc task còn lại
					newTasksState[colId] = newTasksState[colId].filter(
						(t) => !t.dueDate || t.dueDate >= now
					);
					// Thêm task quá hạn vào cột "overdue"
					newTasksState["overdue"] = [
						...newTasksState["overdue"],
						...overdueTasks.map((t) => ({
							...t,
							columnId: "overdue",
						})),
					];
				}
			});

			if (hasChanges) {
				setTasks(newTasksState);
			}
		};

		checkOverdueTasks();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Chỉ chạy 1 lần lúc tải trang

	// --- Logic DND-Kit ---

	// MỚI: Hàm trợ giúp tìm cột
	const findColumnForTask = (taskId: string): string | undefined => {
		return Object.keys(tasks).find((colId) =>
			tasks[colId].some((t) => t.id === taskId)
		);
	};

	// 1. Khi bắt đầu kéo
	function onDragStart(event: DragStartEvent) {
		const { active } = event;
		if (active.data.current?.type === "Column") {
			setActiveColumn(active.data.current.column as Column);
			return;
		}
		if (active.data.current?.type === "Task") {
			setActiveTask(active.data.current.task as Task);
			return;
		}
	}

	// 2. Khi thả
	function onDragEnd(event: DragEndEvent) {
		setActiveColumn(null);
		setActiveTask(null);
		const { active, over } = event;

		if (!over) return;

		// --- Kịch bản 1: Kéo CỘT ---
		if (active.data.current?.type === "Column") {
			if (active.id === over.id) return;

			setColumns((cols) => {
				const activeIndex = cols.findIndex((c) => c.id === active.id);
				const overIndex = cols.findIndex((c) => c.id === over.id);
				return arrayMove(cols, activeIndex, overIndex);
			});
			return;
		}

		// --- Kịch bản 2: Kéo TASK (Sắp xếp trong CÙNG 1 cột) ---
		if (active.data.current?.type === "Task") {
			const activeId = String(active.id);
			const overId = String(over.id);

			const activeColumnId = findColumnForTask(activeId);
			const overColumnId =
				findColumnForTask(overId) ||
				(columns.find((c) => c.id === overId) ? overId : undefined);

			if (activeColumnId === overColumnId) {
				setTasks((currentTasks) => {
					const tasksInColumn = currentTasks[activeColumnId!];
					const activeIndex = tasksInColumn.findIndex(
						(t) => t.id === activeId
					);
					const overIndex = tasksInColumn.findIndex(
						(t) => t.id === overId
					);

					if (activeIndex !== overIndex) {
						const newTasksForColumn = arrayMove(
							tasksInColumn,
							activeIndex,
							overIndex
						);
						return {
							...currentTasks,
							[activeColumnId!]: newTasksForColumn,
						};
					}
					return currentTasks;
				});
			}
		}
	}

	// 3. Khi kéo lơ lửng (Chỉ xử lý di chuyển TASK sang CỘT KHÁC)
	function onDragOver(event: DragOverEvent) {
		const { active, over } = event;
		if (!over) return;

		const activeId = String(active.id);
		const overId = String(over.id);

		// Chỉ xử lý khi kéo Task
		if (active.data.current?.type !== "Task") return;

		const activeColumnId = findColumnForTask(activeId);
		const overColumnId =
			findColumnForTask(overId) ||
			(columns.find((c) => c.id === overId) ? overId : undefined);

		if (
			!activeColumnId ||
			!overColumnId ||
			activeColumnId === overColumnId
		) {
			return;
		}

		// Logic "live" update:
		setTasks((prev) => {
			const activeTask = prev[activeColumnId].find(
				(t) => t.id === activeId
			);
			if (!activeTask) return prev;

			const newTasks = { ...prev };
			// Xóa khỏi cột cũ
			newTasks[activeColumnId] = newTasks[activeColumnId].filter(
				(t) => t.id !== activeId
			);
			// Thêm vào cột mới (vào cuối)
			newTasks[overColumnId] = [
				...newTasks[overColumnId],
				{ ...activeTask, columnId: overColumnId },
			];

			return newTasks;
		});
	}

	// --- Logic Modal ---
	const handleOpenModal = (columnId: string = "todo") => {
		setNewColumnId(columnId); // Đặt cột mục tiêu
		setNewTaskData(defaultNewTask); // Reset form
		setIsModalOpen(true);
	};

	const handleTaskDataChange = (
		field: keyof typeof newTaskData,
		value: any
	) => {
		setNewTaskData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Xử lý khi nhấn "Tạo Task" trong modal
	const handleAddTask = () => {
		if (!newTaskData.title) return; // Yêu cầu tiêu đề

		const newTask: Task = {
			id: crypto.randomUUID(),
			columnId: newColumnId,
			...newTaskData,
		};

		setTasks((prev) => ({
			...prev,
			[newColumnId]: [newTask, ...prev[newColumnId]], // Thêm vào đầu cột
		}));

		setIsModalOpen(false); // Đóng modal
	};

	// MỚI: Thêm Cột Mới
	const handleAddColumn = () => {
		const newColumn: Column = {
			id: `col-${crypto.randomUUID()}`,
			title: "Cột Mới",
		};
		setColumns([...columns, newColumn]);
		setTasks((prev) => ({ ...prev, [newColumn.id]: [] })); // Thêm mảng rỗng cho cột mới
	};

	return (
		<main
			className="h-screen w-screen text-white p-6 transition-all duration-500 overflow-hidden"
			style={{
				backgroundImage: `url(${backgroundUrl})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			<div className="relative w-full h-full">
				{/* === Nội dung chính - Bảng Kanban === */}
				<DndContext
					sensors={sensors}
					collisionDetection={closestCorners}
					onDragStart={onDragStart}
					onDragEnd={onDragEnd}
					onDragOver={onDragOver}
				>
					<div
						className={cn(
							"absolute top-20 bottom-6 left-24 right-24", // Định vị giữa
							"flex flex-col",
							glassEffect
						)}
					>
						{/* Header của bảng */}
						<div className="flex justify-between items-center p-4 border-b border-white/20 flex-shrink-0">
							<h1 className="text-2xl font-bold">Tasks Board</h1>
							<Button
								className="bg-white text-black hover:bg-gray-200"
								onClick={() => handleOpenModal("todo")}
							>
								<Plus size={18} className="mr-2" /> Add Task
							</Button>
						</div>

						{/* Khu vực chứa các cột */}
						<ScrollArea className="flex-1 w-full">
							<div className="flex gap-4 p-4 h-full">
								{/* MỚI: Bọc các cột trong SortableContext NGANG */}
								<SortableContext
									items={columnsId}
									strategy={horizontalListSortingStrategy}
								>
									{columns.map((col) => (
										<KanbanColumn
											key={col.id}
											column={col}
											tasks={tasks[col.id] || []}
											onAddTask={handleOpenModal} // Truyền hàm
										/>
									))}
								</SortableContext>

								{/* MỚI: Nút Thêm Cột Mới */}
								<Button
									variant="outline"
									className="h-full w-80 shrink-0 bg-white/10 border-white/20 hover:bg-white/20 text-white"
									onClick={handleAddColumn}
								>
									<Plus size={18} className="mr-2" /> Thêm cột
									mới
								</Button>
							</div>
							<ScrollBar orientation="horizontal" />
						</ScrollArea>
					</div>

					{/* Overlay khi kéo */}
					<DragOverlay>
						{activeColumn && (
							<KanbanColumn
								column={activeColumn}
								tasks={tasks[activeColumn.id] || []}
								onAddTask={handleOpenModal}
							/>
						)}
						{activeTask && <TaskCard task={activeTask} isOverlay />}
					</DragOverlay>
				</DndContext>

				{/* === MỚI: Dialog Thêm Task === */}
				<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
					<DialogContent className="bg-black/70 backdrop-blur-md border-white/20 text-white">
						<DialogHeader>
							<DialogTitle className="text-white text-2xl">
								Tạo Task Mới (trong cột{" "}
								{
									columns.find((c) => c.id === newColumnId)
										?.title
								}
								)
							</DialogTitle>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="title">
									Tên Task (Bắt buộc)
								</Label>
								<Input
									id="title"
									value={newTaskData.title}
									onChange={(e) =>
										handleTaskDataChange(
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
									value={newTaskData.description}
									onChange={(e) =>
										handleTaskDataChange(
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
									<Label>Độ quan trọng</Label>
									<Select
										value={newTaskData.priority}
										onValueChange={(value: Priority) =>
											handleTaskDataChange(
												"priority",
												value
											)
										}
									>
										<SelectTrigger className="bg-white/10 border-white/30">
											<SelectValue placeholder="Chọn độ ưu tiên" />
										</SelectTrigger>
										<SelectContent className="bg-black/70 backdrop-blur-md border-white/20 text-white">
											<SelectItem value="high">
												Cao
											</SelectItem>
											<SelectItem value="medium">
												Trung bình
											</SelectItem>
											<SelectItem value="low">
												Thấp
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Hạn chót</Label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant={"outline"}
												className={cn(
													"w-full justify-start text-left font-normal bg-white/10 border-white/30",
													!newTaskData.dueDate &&
														"text-gray-300"
												)}
											>
												<CalendarDays className="mr-2 h-4 w-4" />
												{newTaskData.dueDate ? (
													format(
														newTaskData.dueDate,
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
												selected={newTaskData.dueDate}
												onSelect={(date) =>
													handleTaskDataChange(
														"dueDate",
														date
													)
												}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="tags">
									Tags (cách nhau bằng dấu phẩy)
								</Label>
								<Input
									id="tags"
									value={newTaskData.tags?.join(", ")}
									onChange={(e) =>
										handleTaskDataChange(
											"tags",
											e.target.value
												.split(",")
												.map((tag) => tag.trim())
										)
									}
									className="bg-white/10 border-white/30"
									placeholder="Ví dụ: Dev, UI, Báo cáo"
								/>
							</div>
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button variant="ghost">Hủy</Button>
							</DialogClose>
							<Button onClick={handleAddTask}>Tạo Task</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</main>
	);
}
