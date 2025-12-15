// Tên file: app/hooks/useCamera.tsx
"use client";

import React, {
	useState,
	useRef,
	useEffect,
	useCallback,
	RefObject,
	createContext,
	useContext,
	ReactNode,
	useMemo,
	FC,
} from "react";

// --- 1. Định nghĩa Types và Context ---

interface CameraContextType {
	videoRef: RefObject<HTMLVideoElement | null>;
	cameraStream: MediaStream | null;
	camError: string | null;
	isCamActive: boolean; // Trạng thái stream đã sẵn sàng
	toggleCamera: (active: boolean) => void; // Hàm điều khiển từ bên ngoài (Toolbar)
	isWidgetVisible: boolean;
	setIsWidgetVisible: (visible: boolean) => void;
}

// Khởi tạo Context với giá trị mặc định là null (sẽ được cung cấp bởi Provider)
const CameraContext = createContext<CameraContextType | null>(null);

// --- 2. Custom Hook để sử dụng Context ---

export const useCamera = () => {
	const context = useContext(CameraContext);
	if (!context) {
		throw new Error(
			"useCameraContext must be used within a CameraProvider"
		);
	}
	return context;
};

// --- 3. Provider Component (Quản lý State và Logic) ---
export const CameraProvider = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
	const [isCamActive, setIsCamActive] = useState(false); // Trạng thái stream đã sẵn sàng
	const [isAttemptingToStart, setIsAttemptingToStart] = useState(false); // Tránh gọi API liên tục
	const [camError, setCamError] = useState<string | null>(null);
	const [isWidgetVisible, setIsWidgetVisible] = useState(false);

	// --- HÀM TẮT CAMERA ---
	const stopCamera = useCallback(() => {
		if (cameraStream) {
			cameraStream.getTracks().forEach((track) => track.stop());
			setCameraStream(null);
		}
		setIsCamActive(false);
		setIsAttemptingToStart(false);
		setCamError(null);
	}, [cameraStream]);

	// --- HÀM KHỞI ĐỘNG CAMERA (Callback) ---
	const startCamera = useCallback(() => {
		if (isAttemptingToStart || cameraStream) {
			return;
		}

		setIsAttemptingToStart(true);
		setCamError(null);

		// Yêu cầu truy cập video (camera)
		navigator.mediaDevices
			.getUserMedia({ video: true })
			.then((stream) => {
				setCameraStream(stream);
				setIsCamActive(true);
				setIsAttemptingToStart(false);
			})
			.catch((err) => {
				console.error("Không thể truy cập camera:", err);
				setCamError(
					"Không thể bật camera. Vui lòng kiểm tra quyền truy cập."
				);
				setIsCamActive(false);
				setIsAttemptingToStart(false);
			});
	}, [isAttemptingToStart, cameraStream]);

	// --- Điều khiển Luồng Video ---
	useEffect(() => {
		if (cameraStream && videoRef.current) {
			// Gán stream vào thẻ video khi stream sẵn sàng
			videoRef.current.srcObject = cameraStream;
			videoRef.current.muted = true; // đảm bảo muted
			videoRef.current.playsInline = true;
		}
	}, [cameraStream]);

	// --- Interface Điều khiển từ bên ngoài (Toolbar) ---
	const toggleCamera = useCallback(
		(active: boolean) => {
			console.log("Toggling camera. Active:", active);
			if (active) {
				startCamera();
			} else {
				stopCamera();
			}
		},
		[startCamera, stopCamera]
	);

	// Dọn dẹp khi component unmount
	useEffect(() => {
		return () => {
			stopCamera();
		};
	}, [stopCamera]);

	// Giá trị Context
	const contextValue = useMemo(
		() => ({
			videoRef,
			cameraStream,
			camError,
			isCamActive: !!cameraStream, // true nếu stream đang chạy
			toggleCamera,
			isWidgetVisible,
			setIsWidgetVisible,
		}),
		[camError, cameraStream, toggleCamera, isWidgetVisible]
	);

	return (
		<CameraContext.Provider value={contextValue}>
			{children}
		</CameraContext.Provider>
	);
};
