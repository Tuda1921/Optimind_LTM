// Tên file: app/components/DraggableCamera.tsx
"use client";

import React, {
	useState,
	useRef,
	useEffect,
	MouseEvent,
	TouchEvent,
	useCallback,
	FC,
} from "react";
import { Button } from "@/components/ui/button";
import {
	User,
	X,
	GripVertical,
	ArrowDownLeft,
	AlertTriangle,
	VideoOff,
	Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCamera } from "@/hooks/useCamera";

// Hàm tiện ích
const glassEffect =
	"bg-black/40 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

// Định nghĩa Props
interface DraggableCameraProps {}

// Tỉ lệ (W/H)
const ASPECT_RATIO = 256 / 200; // w-64 (256px) / h-[200px]

const DraggableCamera: FC<DraggableCameraProps> = () => {
	// --- STATE ---
	// Kích thước vẫn dùng PX vì nó là kích thước vật lý
	const [size, setSize] = useState({ width: (256 * 150) / 200, height: 150 });

	// THAY ĐỔI: Vị trí giờ là TỶ LỆ % (0-100)
	const [position, setPosition] = useState({ x: 85, y: 27 }); // 50% 50% (ở giữa)

	// State cho hành động (Kéo/Resize)
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);

	// --- REFs ---
	const {
		videoRef,
		isCamActive,
		toggleCamera,
		camError,
		isWidgetVisible,
		setIsWidgetVisible,
	} = useCamera();
	const cameraRef = useRef<HTMLDivElement | null>(null);

	// Ref lưu vị trí chuột ban đầu khi KÉO (tính bằng PX)
	const dragStartRef = useRef({
		startX: 0,
		startY: 0,
		startLeftPercent: 0,
		startTopPercent: 0,
	});
	// Ref lưu vị trí/kích thước ban đầu khi RESIZE (tính bằng PX)
	const resizeStartRef = useRef({
		startX: 0,
		startY: 0,
		startWidth: 0,
		startHeight: 0,
		startLeftPercent: 0,
		startTopPercent: 0,
	});

	const onClose = useCallback(() => {
		toggleCamera(false);
		setIsWidgetVisible(false);
	}, []);

	// --- LOGIC KÉO THẢ (DRAG) ---

	// Xử lý khi di chuột (KÉO)
	const handleDragMouseMove = useCallback((e: globalThis.MouseEvent) => {
		// Tính toán độ chênh lệch (delta) bằng pixel
		const deltaX = e.clientX - dragStartRef.current.startX;
		const deltaY = e.clientY - dragStartRef.current.startY;

		// Chuyển đổi delta (px) sang delta (%)
		const deltaPercentX = (deltaX / window.innerWidth) * 100;
		const deltaPercentY = (deltaY / window.innerHeight) * 100;

		setPosition({
			x: dragStartRef.current.startLeftPercent + deltaPercentX,
			y: dragStartRef.current.startTopPercent + deltaPercentY,
		});
	}, []);

	const handleDragMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	useEffect(() => {
		if (isDragging) {
			window.addEventListener("mousemove", handleDragMouseMove);
			window.addEventListener("mouseup", handleDragMouseUp);
		}
		return () => {
			window.removeEventListener("mousemove", handleDragMouseMove);
			window.removeEventListener("mouseup", handleDragMouseUp);
		};
	}, [isDragging, handleDragMouseMove, handleDragMouseUp]);

	// Xử lý khi nhấn chuột vào icon KÉO
	const handleDragMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
		if (e.button !== 0) return;
		e.preventDefault();
		e.stopPropagation();

		dragStartRef.current = {
			startX: e.clientX,
			startY: e.clientY,
			startLeftPercent: position.x,
			startTopPercent: position.y,
		};
		setIsDragging(true);
	};

	// --- LOGIC PHÓNG TO (RESIZE) TỪ GÓC TRÁI DƯỚI ---

	const handleResizeMouseMove = useCallback((e: globalThis.MouseEvent) => {
		const {
			startX,
			startY,
			startWidth,
			startLeftPercent,
			startTopPercent,
		} = resizeStartRef.current;

		const deltaX = e.clientX - startX;
		const deltaY = e.clientY - startY;

		let delta = 0;
		if (Math.abs(deltaX) > Math.abs(deltaY)) {
			delta = deltaX * -1;
		} else {
			delta = deltaY;
		}

		let newWidth = startWidth + delta;
		if (newWidth < 200) newWidth = 200; // Min width
		if (newWidth > 600) newWidth = 600; // Max width

		const newHeight = newWidth / ASPECT_RATIO;
		const deltaWidth = newWidth - startWidth;

		// Chuyển đổi deltaWidth (px) sang %
		const deltaPercentX = (deltaWidth / window.innerWidth) * 100;

		setSize({ width: newWidth, height: newHeight });
		setPosition({
			x: startLeftPercent - deltaPercentX / 2, // Dịch sang trái 1 nửa độ chênh lệch %
			y: startTopPercent,
		});
	}, []);

	const handleResizeMouseUp = useCallback(() => {
		setIsResizing(false);
	}, []);

	useEffect(() => {
		if (isResizing) {
			window.addEventListener("mousemove", handleResizeMouseMove);
			window.addEventListener("mouseup", handleResizeMouseUp);
		}
		return () => {
			window.removeEventListener("mousemove", handleResizeMouseMove);
			window.removeEventListener("mouseup", handleResizeMouseUp);
		};
	}, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

	const handleResizeMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
		if (e.button !== 0) return;
		e.preventDefault();
		e.stopPropagation();

		if (cameraRef.current) {
			resizeStartRef.current = {
				startX: e.clientX,
				startY: e.clientY,
				startWidth: size.width,
				startHeight: size.height,
				startLeftPercent: position.x,
				startTopPercent: position.y,
			};
			setIsResizing(true);
		}
	};

	return (
		<div
			ref={cameraRef}
			className={cn(
				"absolute z-40 rounded-xl overflow-hidden",
				isDragging ? "cursor-grabbing" : "cursor-auto",
				"transition-opacity duration-300",
				isWidgetVisible ? "opacity-100" : "opacity-0 hidden",
				glassEffect
			)}
			style={{
				// THAY ĐỔI: Sử dụng % và transform
				left: `${position.x}%`,
				top: `${position.y}%`,
				transform: "translate(-50%, -50%)", // Căn giữa box tại vị trí %
				width: `${size.width}px`,
				height: `${size.height}px`,
			}}
		>
			{/* THAY ĐỔI: Hiển thị Video hoặc Placeholder */}
			{isCamActive && !camError ? (
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted
					className="w-full h-full object-cover rounded-xl"
				/>
			) : (
				<div className="flex h-full w-full items-center justify-center bg-black/50 text-center p-4">
					{camError ? (
						<div className="text-red-400 space-y-2">
							<AlertTriangle className="h-10 w-10 mx-auto" />
							<p className="text-sm">Lỗi: {camError}</p>
							<p className="text-xs text-gray-300">
								Vui lòng cấp quyền truy cập camera.
							</p>
						</div>
					) : (
						<User className="h-16 w-16 text-gray-500" />
					)}
				</div>
			)}

			{/* Nhóm icon ở góc trên bên phải */}
			<div className="absolute top-2 right-2 z-10 flex gap-1">
				{/* NÚT BẬT/TẮT CAMERA (TRONG WIDGET) */}
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"h-6 w-6 rounded-full bg-gray-500/40 hover:bg-gray-500/50",
						isCamActive ? "text-red-400" : "text-green-400"
					)}
					onClick={(e) => {
						e.stopPropagation();
						toggleCamera(!isCamActive); // Bật/Tắt luồng video thực
					}}
				>
					{isCamActive ? (
						<VideoOff className="h-5 w-5" />
					) : (
						<Video className="h-5 w-5" />
					)}
				</Button>
				{/* Icon Kéo (Drag Handle) */}
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 rounded-full cursor-grab bg-white/10 text-white hover:bg-white/20"
					onMouseDown={handleDragMouseDown}
					onClick={(e) => e.stopPropagation()}
				>
					<GripVertical className="h-5 w-5" />
				</Button>

				{/* Nút đóng */}
				<Button
					onClick={(e) => {
						e.stopPropagation();
						onClose();
					}}
					variant="ghost"
					size="icon"
					className="h-6 w-6 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-red-400"
				>
					<X className="h-5 w-5" />
				</Button>
			</div>

			{/* Icon Phóng to (Resize Handle) */}
			<Button
				variant="ghost"
				size="icon"
				className="absolute bottom-1 left-1 h-6 w-6 rounded-full z-10 cursor-nesw-resize bg-white/10 text-white hover:bg-white/20"
				onMouseDown={handleResizeMouseDown}
				onClick={(e) => e.stopPropagation()}
			>
				<ArrowDownLeft className="h-4 w-4" />
			</Button>

			{/* Nội dung Camera */}
			<div className="flex h-full w-full items-center justify-center bg-black/30">
				<User className="h-16 w-16 text-gray-500" />
			</div>
		</div>
	);
};

export default DraggableCamera;
