// Tên file: app/history/page.tsx
"use client";

import { useState, FC } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area"; // MỚI
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
	Music,
	Waves,
	Image as ImageIcon,
	X,
	CalendarDays,
	CalendarClock,
	Clock,
	Brain,
	TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
// MỚI: Imports cho Biểu đồ
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

// --- MỚI: Định nghĩa Types ---
interface Task {
	id: string;
	title: string;
	completed: boolean;
}

interface FocusDataPoint {
	time: number; // Phút
	focus: number; // %
}

interface Session {
	id: string;
	title: string;
	date: string;
	totalTime: number; // phút
	focusedTime: number; // phút
	avgFocus: number; // %
	efficiency: number; // %
	tasks: Task[]; // Các task đã làm
	focusData: FocusDataPoint[]; // Dữ liệu cho biểu đồ
}

// --- Dữ liệu giả (Mock Data) CẬP NHẬT ---
const mockSessions: Session[] = [
	{
		id: "1",
		title: "Ôn tập Hệ phân tán (Chương 3)",
		date: "04/11/2025 - 09:00",
		totalTime: 50,
		focusedTime: 45,
		avgFocus: 90,
		efficiency: 92,
		tasks: [
			{ id: "t1", title: "Đọc slide Chương 3", completed: true },
			{ id: "t2", title: "Làm bài tập cuối chương", completed: true },
		],
		focusData: [
			{ time: 0, focus: 80 },
			{ time: 10, focus: 85 },
			{ time: 20, focus: 95 },
			{ time: 30, focus: 90 },
			{ time: 40, focus: 88 },
			{ time: 50, focus: 92 },
		],
	},
	{
		id: "2",
		title: "Làm dự án Optimind (UI/UX)",
		date: "03/11/2025 - 14:00",
		totalTime: 120,
		focusedTime: 90,
		avgFocus: 75,
		efficiency: 80,
		tasks: [
			{ id: "t3", title: "Thiết kế trang Chat", completed: true },
			{ id: "t4", title: "Thiết kế trang Kế hoạch", completed: true },
			{ id: "t5", title: "Vẽ wireframe cho Phòng học", completed: true },
		],
		focusData: [
			{ time: 0, focus: 60 },
			{ time: 20, focus: 75 },
			{ time: 40, focus: 85 },
			{ time: 60, focus: 70 },
			{ time: 80, focus: 75 },
			{ time: 100, focus: 80 },
			{ time: 120, focus: 78 },
		],
	},
	{
		id: "3",
		title: "Thi đấu Pomodoro",
		date: "03/11/2025 - 10:00",
		totalTime: 25,
		focusedTime: 24,
		avgFocus: 96,
		efficiency: 98,
		tasks: [{ id: "t6", title: "Thi đấu", completed: true }],
		focusData: [
			{ time: 0, focus: 90 },
			{ time: 5, focus: 95 },
			{ time: 10, focus: 98 },
			{ time: 15, focus: 92 },
			{ time: 20, focus: 97 },
			{ time: 25, focus: 98 },
		],
	},
];

// Dữ liệu giả cho Tổng quan
const mockOverallStats = {
	day: { totalTime: 4.5, tasks: 5, avgFocus: 88, efficiency: 90 },
	week: { totalTime: 22, tasks: 28, avgFocus: 85, efficiency: 88 },
	month: { totalTime: 80, tasks: 110, avgFocus: 82, efficiency: 85 },
};
const mockOverallChartData = [
	{ name: "T2", focus: 80 },
	{ name: "T3", focus: 85 },
	{ name: "T4", focus: 95 },
	{ name: "T5", focus: 90 },
	{ name: "T6", focus: 78 },
	{ name: "T7", focus: 88 },
	{ name: "CN", focus: 92 },
];
// --- Kết thúc Mock Data ---

// --- Component con ---
const StatCard: FC<{ title: string; value: string; icon: React.ReactNode }> = ({
	title,
	value,
	icon,
}) => (
	<div className="bg-black/20 p-4 rounded-lg flex items-center gap-3">
		<div className="p-2 bg-white/10 rounded-md">{icon}</div>
		<div>
			<Label className="text-xs text-white/70">{title}</Label>
			<p className="text-xl font-bold">{value}</p>
		</div>
	</div>
);

// MỚI: Component Biểu đồ (thay thế Placeholder)
const FocusLineChart: FC<{ data: FocusDataPoint[] | any[] }> = ({ data }) => (
	<div className="w-full h-48 bg-black/20 rounded-lg p-4 border border-white/10">
		<ResponsiveContainer width="100%" height="100%">
			<LineChart
				data={data}
				margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
			>
				<CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
				<XAxis
					dataKey="time"
					stroke="#ffffff80"
					fontSize={12}
					tickLine={false}
					axisLine={false}
					tickFormatter={(val) => `${val}m`}
				/>
				<YAxis
					stroke="#ffffff80"
					fontSize={12}
					unit="%"
					domain={[0, 100]}
					tickLine={false}
					axisLine={false}
				/>
				<Tooltip
					contentStyle={{
						backgroundColor: "rgba(0, 0, 0, 0.8)",
						border: "none",
						borderRadius: "8px",
						color: "#fff",
					}}
					labelFormatter={(val) => `Phút ${val}`}
				/>
				<Line
					type="monotone"
					dataKey="focus"
					stroke="#3b82f6" // Màu xanh
					strokeWidth={2}
					activeDot={{ r: 8 }}
					dot={false}
				/>
			</LineChart>
		</ResponsiveContainer>
	</div>
);

// --- Component chính ---
export default function HistoryPage() {
	// === State cho Trang ===
	const [filter, setFilter] = useState<"day" | "week" | "month">("day");
	const [selectedSession, setSelectedSession] = useState<Session | null>(
		null
	);

	// [CẬP NHẬT] Thêm state cho camera (từ trang study)
	const [isCameraOn, setCameraOn] = useState(false);

	// Hàm tiện ích
	const glassEffect =
		"bg-black/30 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

	// Lấy dữ liệu tổng quan
	const overallStats = mockOverallStats[filter];

	return (
		<main className="h-screen w-screen text-white p-6 transition-all duration-500">
			<div className="absolute inset-0 w-full h-full" />
			<div className="relative w-full h-full">
				{/* === Nội dung chính - Lịch sử học tập === */}
				{/* (Phần này giữ nguyên) */}
				<div
					className={cn(
						"absolute h-140 w-200 top-1/12 left-1/2 -translate-x-1/2", // Định vị giữa
						"flex divide-x divide-white/20", // Layout 2 cột
						glassEffect,
						"overflow-hidden"
					)}
				>
					{/* --- Cột 1: Danh sách Lịch sử --- */}
					<div className="flex-[0.5] p-4 flex flex-col gap-4">
						{/* Header */}
						<div className="flex justify-between items-center">
							<h1 className="text-2xl font-bold">
								Lịch sử học tập
							</h1>
						</div>

						{/* Bộ lọc Tabs */}
						<ToggleGroup
							type="single"
							defaultValue="day"
							value={filter}
							onValueChange={(value: "day" | "week" | "month") =>
								value && setFilter(value)
							}
							className="w-full justify-start"
						>
							<ToggleGroupItem
								value="day"
								className="data-[state=on]:bg-white/30 hover:bg-white/10 text-white"
							>
								<CalendarDays size={16} className="mr-2" /> Ngày
							</ToggleGroupItem>
							<ToggleGroupItem
								value="week"
								className="data-[state=on]:bg-white/30 hover:bg-white/10 text-white"
							>
								<CalendarClock size={16} className="mr-2" />{" "}
								Tuần
							</ToggleGroupItem>
							<ToggleGroupItem
								value="month"
								className="data-[state=on]:bg-white/30 hover:bg-white/10 text-white"
							>
								<CalendarClock size={16} className="mr-2" />{" "}
								Tháng
							</ToggleGroupItem>
						</ToggleGroup>

						{/* Danh sách (scrollable) */}
						<ScrollArea className="flex-1 -mr-4 pr-3">
							<div className="space-y-2">
								{mockSessions.map((session) => (
									<button
										key={session.id}
										onClick={() =>
											setSelectedSession(session)
										}
										className={cn(
											"w-full text-left p-3 rounded-lg flex items-center gap-4 transition-colors",
											"hover:bg-white/20",
											selectedSession?.id ===
												session.id && "bg-white/20"
										)}
									>
										<div className="p-3 bg-black/20 rounded-md">
											<Clock size={20} />
										</div>
										<div className="flex-1 overflow-hidden min-w-0">
											<h4 className="font-semibold truncate">
												{session.title}
											</h4>
											<p className="text-xs text-white/70">
												{session.date}
											</p>
										</div>
										<div className="text-right">
											<p className="font-semibold text-lg">
												{session.totalTime} phút
											</p>
											<p className="text-xs text-green-400">
												{session.avgFocus}% tập trung
											</p>
										</div>
									</button>
								))}
							</div>
						</ScrollArea>
					</div>

					{/* --- Cột 2: Chi tiết Phiên học / Tổng quan --- */}
					<div className="flex-[0.5] flex flex-col h-full">
						{selectedSession ? (
							// === CHẾ ĐỘ XEM CHI TIẾT ===
							<>
								{/* Header */}
								<div className="p-4 flex justify-between items-center border-b border-white/20">
									<h3 className="text-xl font-bold truncate">
										{selectedSession.title}
									</h3>
									<Button
										variant="ghost"
										size="icon"
										className="text-white/70 hover:text-white hover:bg-white/20"
										onClick={() => setSelectedSession(null)}
									>
										<X size={20} />
									</Button>
								</div>

								{/* Nội dung Info */}
								<ScrollArea className="flex-1 p-4 overflow-hidden">
									<div className="space-y-4">
										<p className="text-sm text-white/80 border-b border-white/10 pb-4">
											Chi tiết phiên học ngày{" "}
											{selectedSession.date}
										</p>

										<div className="grid grid-cols-2 gap-3">
											<StatCard
												title="Tổng thời gian học"
												value={`${selectedSession.totalTime} phút`}
												icon={
													<Clock
														size={20}
														className="text-white/90"
													/>
												}
											/>
											<StatCard
												title="Thời gian tập trung"
												value={`${selectedSession.focusedTime} phút`}
												icon={
													<Brain
														size={20}
														className="text-green-400"
													/>
												}
											/>
											<StatCard
												title="Độ tập trung TB"
												value={`${selectedSession.avgFocus}%`}
												icon={
													<BarChart2
														size={20}
														className="text-blue-400"
													/>
												}
											/>
											<StatCard
												title="Hiệu suất"
												value={`${selectedSession.efficiency}%`}
												icon={
													<TrendingUp
														size={20}
														className="text-yellow-400"
													/>
												}
											/>
										</div>

										<div className="pt-4">
											<h4 className="font-semibold mb-2">
												Biểu đồ độ tập trung
											</h4>
											{/* MỚI: Biểu đồ thật */}
											<FocusLineChart
												data={selectedSession.focusData}
											/>
										</div>

										{/* MỚI: Danh sách Task */}
										<div className="pt-4">
											<h4 className="font-semibold mb-2">
												Các task đã hoàn thành
											</h4>
											<div className="space-y-2">
												{selectedSession.tasks.map(
													(task) => (
														<div
															key={task.id}
															className="bg-black/20 p-3 rounded-md flex items-center"
														>
															<CheckSquare
																size={16}
																className="mr-2 text-green-400"
															/>
															<span className="text-sm">
																{task.title}
															</span>
														</div>
													)
												)}
											</div>
										</div>
									</div>
								</ScrollArea>
							</>
						) : (
							// === CHẾ ĐỘ TỔNG QUAN ===
							<>
								{/* Header */}
								<div className="p-4 flex justify-between items-center border-b border-white/20">
									<h3 className="text-xl font-bold truncate">
										Tổng quan (Theo{" "}
										{filter === "day"
											? "Ngày"
											: filter === "week"
											? "Tuần"
											: "Tháng"}
										)
									</h3>
								</div>
								{/* Nội dung Info */}
								<ScrollArea className="flex-1 p-4 overflow-hidden">
									<p className="text-sm text-white/80 border-b border-white/10 pb-4">
										Thống kê tổng hợp
									</p>
									{/* Thống kê tổng quan */}
									<div className="grid grid-cols-2 gap-3">
										<StatCard
											title="Tổng thời gian học"
											value={`${overallStats.totalTime} giờ`}
											icon={
												<Clock
													size={20}
													className="text-white/90"
												/>
											}
										/>
										<StatCard
											title="Task hoàn thành"
											value={`${overallStats.tasks} tasks`}
											icon={
												<CheckSquare
													size={20}
													className="text-green-400"
												/>
											}
										/>
										<StatCard
											title="Độ tập trung TB"
											value={`${overallStats.avgFocus}%`}
											icon={
												<Brain
													size={20}
													className="text-blue-400"
												/>
											}
										/>
										<StatCard
											title="Hiệu suất TB"
											value={`${overallStats.efficiency}%`}
											icon={
												<TrendingUp
													size={20}
													className="text-yellow-400"
												/>
											}
										/>
									</div>
									{/* Biểu đồ tổng quan */}
									<div className="pt-4">
										<h4 className="font-semibold mb-2">
											Hoạt động 7 ngày qua (Focus %)
										</h4>
										{/* (Dùng data giả, bạn có thể thay bằng data thật) */}
										<FocusLineChart
											data={mockOverallChartData}
										/>
									</div>
								</ScrollArea>
							</>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
