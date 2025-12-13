// Tên file: app/study/page.tsx
"use client";

import { useState, useEffect, FC, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

import PomodoroTimer from "@/components/study/timer";
import TaskListWidget from "@/components/study/task-list";
import FocusChartWidget from "@/components/study/focus-chart";


// --- Component Chính: Trang Học Tập ---
const StudyPage: FC = () => {
	// === State Chung ===
	const [showTasks, setShowTasks] = useState<boolean>(true); // Quản lý hiển thị Task
	const [isRunning, setIsRunning] = useState<boolean>(false);

	return (
		<main className="h-screen w-screen text-white p-6 transition-all duration-500 overflow-hidden">
			<div className="relative w-full h-full">
				{/* === Nội dung chính (Các Widget) === */}
				<div
					className={cn(
						"absolute top-1/11 left-1/2 -translate-x-1/2 w-[900px] h-140",
						"flex flex-col items-center justify-between"
					)}
				>
					{/* Widget 1: Pomodoro (Giữa) */}
					<PomodoroTimer
						showTasks={showTasks}
						onToggleTasks={() => setShowTasks(!showTasks)}
						isRunning={isRunning}
						setIsRunning={setIsRunning}
					/>

					<div className="flex gap-5 w-full h-full pt-4 justify-between">
						{/* Widget 2: Task List (Trái - Dưới) */}
						<TaskListWidget
							show={showTasks}
							onClose={() => setShowTasks(false)}
						/>

						{/* Widget 3: Biểu đồ Độ tập trung (Giữa - Dưới) */}
						<FocusChartWidget isRunning={isRunning} />
					</div>
				</div>
			</div>
		</main>
	);
};

export default StudyPage;
