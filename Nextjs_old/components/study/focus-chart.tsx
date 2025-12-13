// Tên file: app/components/FocusChartWidget.tsx
"use client";

import React, { FC, useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { useCamera } from "@/hooks/useCamera";

// MỚI: Export FocusDataPoint type
export interface FocusDataPoint {
	time: number; // Giây (để thể hiện thời gian trôi qua)
	focus: number; // %
}

// Hàm tiện ích
const glassEffect =
	"bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg";

// Định nghĩa Props
interface FocusChartWidgetProps {
	isRunning: boolean;
}

// Component Biểu đồ
const FocusChartWidget: FC<FocusChartWidgetProps> = ({ isRunning }) => {
	const { isCamActive } = useCamera();
	const [focusData, setFocusData] = useState<FocusDataPoint[]>([]);
	const [currentSecondsElapsed, setCurrentSecondsElapsed] =
		useState<number>(0);

	// Hiển thị điểm tập trung hiện tại (lấy điểm cuối cùng)
	const currentFocus =
		focusData.length > 0 ? focusData[focusData.length - 1].focus : 0;

	useEffect(() => {
		let focusInterval: NodeJS.Timeout | null = null;
		// Chỉ thu thập dữ liệu khi đang ở chế độ FOCUS và Timer đang chạy
		if (isRunning) {
			focusInterval = setInterval(() => {
				setCurrentSecondsElapsed((prev) => prev + 1);

				// 1. Tính toán mức độ tập trung
				let currentFocusScore = 0;
				// MÔ PHỎNG: Dùng isCamActive để mô phỏng data
				if (isCamActive) {
					currentFocusScore = Math.floor(Math.random() * 31) + 70;
				} else {
					currentFocusScore = 0;
				}

				// 2. Thêm dữ liệu vào array
				setFocusData((prevData) => [
					...prevData,
					{ time: prevData.length + 1, focus: currentFocusScore },
				]);
			}, 1000); // Thu thập mỗi giây
		}

		return () => {
			if (focusInterval) clearInterval(focusInterval);
		};
	}, [isRunning, isCamActive]); // Giữ isCameraOn để kích hoạt lại nếu trạng thái thay đổi

	return (
		<div
			className={cn("w-full h-full px-4 pt-3 flex flex-col", glassEffect)}
		>
			<div className="flex justify-between items-center mb-1">
				<p className="font-semibold text-gray-200">Độ tập trung</p>
				<p
					className="text-xl font-bold"
					style={{ color: currentFocus > 70 ? "#4ADE80" : "#F87171" }}
				>
					{currentFocus}%
				</p>
			</div>

			{/* Biểu đồ Line Chart */}
			<div className="flex-1">
				<ResponsiveContainer width="100%" height="90%">
					<LineChart
						data={focusData}
						margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="#ffffff1a"
						/>
						<XAxis
							dataKey="time"
							stroke="#ffffff80"
							fontSize={10}
							tickLine={false}
							axisLine={false}
							tickFormatter={(val) => `${val}s`}
							tickMargin={10}
						/>
						<YAxis
							stroke="#ffffff80"
							fontSize={10}
							unit="%"
							domain={[0, 100]}
							tickLine={false}
							axisLine={false}
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: "rgba(0, 0, 0, 0.7)",
								border: "1px solid #ffffff44",
								borderRadius: "4px",
								color: "#fff",
							}}
							labelFormatter={(val) => `Thời gian: ${val}s`}
							formatter={(value, name) => [`${value}%`]}
						/>
						<Line
							type="monotone"
							dataKey="focus"
							stroke="#3b82f6" // Màu xanh
							strokeWidth={2}
							dot={false}
							isAnimationActive={false} // Tắt animation để cập nhật mượt hơn
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default FocusChartWidget;
