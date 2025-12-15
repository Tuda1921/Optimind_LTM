// Tên file: app/study/page.tsx
"use client";

import { useState, useEffect, FC, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

import PomodoroTimer from "@/components/study/timer";
import TaskListWidget from "@/components/study/task-list";
import FocusChartWidget from "@/components/study/focus-chart";
import VideoEngagementAnalyzer from "@/components/test/engagement-analyzer";


// --- Component Chính: Trang Học Tập ---
const StudyPage: FC = () => {
	// === State Chung ===
	const [showTasks, setShowTasks] = useState<boolean>(true); // Quản lý hiển thị Task
	const [isRunning, setIsRunning] = useState<boolean>(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [currentFocusScore, setCurrentFocusScore] = useState<number>(0);
	const focusLogsRef = useRef<number[]>([]); // Store focus scores for session

	// Start a new study session on component mount
	useEffect(() => {
		const startSession = async () => {
			try {
				const res = await fetch("/api/sessions", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ topicName: "Study Session" }),
				});

				if (res.ok) {
					const data = await res.json();
					setSessionId(data.session.id);
				}
			} catch (error) {
				console.error("Failed to start session:", error);
			}
		};

		startSession();

		// Clean up: end session when page unmounts
		return () => {
			if (sessionId) {
				// Calculate average focus score
				const avgFocus = focusLogsRef.current.length > 0
					? Math.round(
							focusLogsRef.current.reduce((a, b) => a + b, 0) /
								focusLogsRef.current.length
					  )
					: 50;

				fetch(`/api/sessions/${sessionId}/end`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ focusScore: avgFocus }),
				}).catch(console.error);
			}
		};
	}, [sessionId]);

	// Log focus score every second to API
	useEffect(() => {
		let logInterval: NodeJS.Timeout | null = null;

		if (isRunning && sessionId && currentFocusScore > 0) {
			logInterval = setInterval(async () => {
				try {
					await fetch(`/api/sessions/${sessionId}/focus-log`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ focusScore: currentFocusScore }),
					});
					focusLogsRef.current.push(currentFocusScore);
				} catch (err) {
					console.error("Failed to log focus score:", err);
				}
			}, 1000); // Log every second
		}

		return () => {
			if (logInterval) clearInterval(logInterval);
		};
	}, [isRunning, sessionId, currentFocusScore]);

	return (
		<main className="h-screen w-screen text-white p-6 transition-all duration-500 overflow-hidden">
			<div className="relative w-full h-full">
				{/* === Hidden: AI Camera Analysis (Background Process) === */}
				{isRunning && (
					<div className="absolute top-0 right-0 z-50" style={{ width: '320px', height: '240px' }}>
						<VideoEngagementAnalyzer 
							onScoreUpdate={setCurrentFocusScore}
							isActive={isRunning}
						/>
					</div>
				)}

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
						<FocusChartWidget 
							isRunning={isRunning}
							currentFocusScore={currentFocusScore}
						/>
					</div>
				</div>
			</div>
		</main>
	);
};

export default StudyPage;
