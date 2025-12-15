// Tên file: app/study/page.tsx
"use client";

import { useState, useEffect, FC, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useFocusWs } from "@/hooks/useFocusWs";

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
	const [coinsEarned, setCoinsEarned] = useState<number | null>(null);
	const hasActiveSession = useRef<boolean>(false);
	const { connected, error, startSession, endSession, client } = useFocusWs();

	// Register session_result listener once
	useEffect(() => {
		if (!connected) return;
		const off = client.on("session_result", (data: any) => {
			const coins = typeof data?.coins === "number" ? data.coins : null;
			if (coins !== null) setCoinsEarned(coins);
		});
		return () => {
			off();
		};
	}, [connected, client]);

	// Start/end session only once per run cycle
	useEffect(() => {
		if (!connected) return;
		if (isRunning && !hasActiveSession.current) {
			startSession()
				.then(() => {
					hasActiveSession.current = true;
					setCoinsEarned(null);
					focusLogsRef.current = [];
					setSessionId("ws-session");
				})
				.catch((e) => {
					console.error("WS startSession failed:", e);
				});
		}
		if (!isRunning && hasActiveSession.current) {
			const avgFocus = focusLogsRef.current.length > 0
				? Math.round(
						focusLogsRef.current.reduce((a, b) => a + b, 0) /
							focusLogsRef.current.length
				  )
				: 50;
			endSession()
				.then(() => {
					hasActiveSession.current = false;
				})
				.catch((e) => {
					console.error("WS endSession failed:", e);
				});
		}
	}, [connected, isRunning, startSession, endSession]);

	// Log focus score locally for avg computation
	useEffect(() => {
		let logInterval: NodeJS.Timeout | null = null;

		if (isRunning && currentFocusScore > 0) {
			logInterval = setInterval(async () => {
				focusLogsRef.current.push(currentFocusScore);
			}, 1000); // Log every second
		}

		return () => {
			if (logInterval) clearInterval(logInterval);
		};
	}, [isRunning, currentFocusScore]);

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
						{/* Coins Result (shows after session end) */}
						{coinsEarned !== null && (
							<div className="text-center text-lg font-semibold">
								Coins earned: {coinsEarned}
							</div>
						)}
					</div>
				</div>
			</div>
		</main>
	);
};

export default StudyPage;
