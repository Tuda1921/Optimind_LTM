"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as ort from "onnxruntime-web";

// =========================================================
// CẤU HÌNH (PHẢI KHỚP VỚI MÔ HÌNH PYTHON)
// =========================================================
const MODEL_PATH = "/best_engagement_model.onnx"; // Đường dẫn từ thư mục public
const INPUT_NAME = "input_frames";
const OUTPUT_NAME = "output_scores";
const INPUT_H = 224;
const INPUT_W = 224;
const SEQUENCE_LENGTH = 30; // T (số frames)

// Giá trị chuẩn hóa (Normalize) từ PyTorch ImageNet
const NORM_MEAN = [0.485, 0.456, 0.406];
const NORM_STD = [0.229, 0.224, 0.225];

const CLASS_LABELS = ["Boredom", "Engagement", "Confusion", "Frustration"];
const NUM_CLASSES = CLASS_LABELS.length;

// =========================================================
// COMPONENT CHÍNH
// =========================================================

export default function VideoEngagementAnalyzer() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const ortSessionRef = useRef<ort.InferenceSession | null>(null);
	const frameQueueRef = useRef<Float32Array[]>([]);
	const rafIdRef = useRef<number | null>(null);

	const [status, setStatus] = useState<string>("Đang tải mô hình...");
	const [prediction, setPrediction] = useState<{
		label: string;
		probabilities: { label: string; percentage: string }[];
	} | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	/**
	 * Lấy dữ liệu frame từ canvas, resize và chuẩn hóa (Normalize)
	 */
	const normalizeFrame = useCallback((): Float32Array | null => {
		const canvas = canvasRef.current;
		const video = videoRef.current;

		if (!canvas || !video || video.paused || video.ended) return null;

		const ctx = canvas.getContext("2d");
		if (!ctx) return null;

		// 1. Vẽ frame video lên canvas (224x224)
		ctx.drawImage(
			video,
			0,
			0,
			video.videoWidth,
			video.videoHeight,
			0,
			0,
			INPUT_W,
			INPUT_H
		);

		const imageData = ctx.getImageData(0, 0, INPUT_W, INPUT_H);
		const data = imageData.data;

		// 2. Chuẩn hóa và chuyển sang định dạng CHW (Channel-Height-Width)
		const frameTensorData = new Float32Array(INPUT_W * INPUT_H * 3);
		let offsetR = 0;
		let offsetG = INPUT_W * INPUT_H;
		let offsetB = INPUT_W * INPUT_H * 2;

		for (let i = 0; i < data.length; i += 4) {
			const pixelIndex = i / 4;

			// P_normalized = ((P / 255.0) - mean) / std
			frameTensorData[offsetR + pixelIndex] =
				(data[i] / 255.0 - NORM_MEAN[0]) / NORM_STD[0];
			frameTensorData[offsetG + pixelIndex] =
				(data[i + 1] / 255.0 - NORM_MEAN[1]) / NORM_STD[1];
			frameTensorData[offsetB + pixelIndex] =
				(data[i + 2] / 255.0 - NORM_MEAN[2]) / NORM_STD[2];
		}

		return frameTensorData;
	}, []);

	/**
	 * Chạy suy luận (Inference) trên 30 frame
	 */
	const runInference = useCallback(
		async (session: ort.InferenceSession, queue: Float32Array[]) => {
			if (isProcessing) return;
			setIsProcessing(true);
			setStatus("Đang xử lý và dự đoán...");

			// 1. Tạo mảng Tensor tổng hợp (Flat array)
			const totalSize = SEQUENCE_LENGTH * INPUT_W * INPUT_H * 3;
			const fullTensorData = new Float32Array(totalSize);
			const frameSize = INPUT_W * INPUT_H * 3;

			// Xếp 30 frame (CHW) vào mảng Tensor phẳng
			queue.forEach((frameData, t) => {
				fullTensorData.set(frameData, t * frameSize);
			});

			// 2. Tạo ONNX Tensor
			const inputTensor = new ort.Tensor(
				"float32",
				fullTensorData,
				[1, SEQUENCE_LENGTH, 3, INPUT_H, INPUT_W] // Shape (B, T, C, H, W)
			);

			// 3. Chạy Inference
			try {
				const feeds = { [INPUT_NAME]: inputTensor };
				const results = await session.run(feeds);
				const outputData = results[OUTPUT_NAME].data as Float32Array;

				// 4. Xử lý và hiển thị kết quả (Softmax)
				displayResults(outputData);
			} catch (e) {
				console.error("Lỗi khi chạy mô hình ONNX:", e);
				setStatus(`LỖI DỰ ĐOÁN: ${(e as Error).message}`);
			} finally {
				setIsProcessing(false);
			}
		},
		[isProcessing]
	);

	/**
	 * Cập nhật State kết quả dự đoán
	 */
	const displayResults = useCallback((output: Float32Array) => {
		let maxScore = -Infinity;
		let maxIndex = -1;

		// Tìm lớp có điểm số cao nhất
		output.forEach((score, index) => {
			if (score > maxScore) {
				maxScore = score;
				maxIndex = index;
			}
		});

		// Chuyển logits thành xác suất (Softmax)
		const expScores = Array.from(output).map(Math.exp);
		const sumExpScores = expScores.reduce((a, b) => a + b, 0);
		const probabilities = expScores.map((score) => score / sumExpScores);

		const formattedResults = probabilities.map((prob, index) => ({
			label: CLASS_LABELS[index],
			percentage: (prob * 100).toFixed(2),
		}));

		setPrediction({
			label: CLASS_LABELS[maxIndex],
			probabilities: formattedResults,
		});

		setStatus("Đang chờ frame mới...");
	}, []);

	/**
	 * Vòng lặp chính quản lý frame
	 */
	const processVideoLoop = useCallback(() => {
		const session = ortSessionRef.current;
		const video = videoRef.current;

		if (!session || !video || video.paused || video.ended) {
			rafIdRef.current = requestAnimationFrame(processVideoLoop);
			return;
		}

		// 1. Lấy và chuẩn hóa frame hiện tại
		const newFrameData = normalizeFrame();
		if (newFrameData) {
			frameQueueRef.current.push(newFrameData);
		}

		// 2. Quản lý Queue: Giữ kích thước queue là SEQUENCE_LENGTH
		if (frameQueueRef.current.length > SEQUENCE_LENGTH) {
			frameQueueRef.current.shift(); // Loại bỏ frame cũ nhất
		}

		// 3. Chạy Inference nếu queue đã đầy và không có process nào đang chạy
		if (frameQueueRef.current.length === SEQUENCE_LENGTH && !isProcessing) {
			// Truyền một bản sao của queue để tránh lỗi race condition
			runInference(session, [...frameQueueRef.current]);
		} else {
			setStatus(
				`Đang thu thập frame: ${frameQueueRef.current.length}/${SEQUENCE_LENGTH}...`
			);
		}

		rafIdRef.current = requestAnimationFrame(processVideoLoop);
	}, [normalizeFrame, runInference, isProcessing]);

	// =========================================================
	// useEffect: Khởi tạo
	// =========================================================
	useEffect(() => {
		let stream: MediaStream | null = null;

		// Hàm tải mô hình ONNX
		const loadModel = async () => {
			try {
				// Thiết lập cấu hình ONNX Runtime Web
				ort.env.wasm.numThreads = 1;

				const session = await ort.InferenceSession.create(MODEL_PATH, {
					executionProviders: ["wasm"],
					freeDimensionOverrides: { batch_size: 1 },
				});
				ortSessionRef.current = session;
				setStatus("✅ Tải mô hình ONNX thành công. Đang chờ camera...");
				console.log("ONNX Model loaded:", session);
				await startCamera();
			} catch (e) {
				console.error("Lỗi khi tải mô hình ONNX:", e);
				setStatus(
					`LỖI: Không tải được mô hình. ${(e as Error).message}`
				);
			}
		};

		// Hàm khởi tạo camera
		const startCamera = async () => {
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					video: { width: 640, height: 480 }, // Yêu cầu độ phân giải ổn định
				});
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					videoRef.current.onloadeddata = () => {
						// Bắt đầu vòng lặp xử lý frame
						rafIdRef.current =
							requestAnimationFrame(processVideoLoop);
					};
				}
			} catch (e) {
				console.error("Lỗi khi truy cập camera:", e);
				setStatus(
					`LỖI: Không truy cập được camera. Vui lòng cấp quyền.`
				);
			}
		};

		loadModel();

		// Cleanup: Dừng vòng lặp và tắt camera khi component unmount
		return () => {
			if (rafIdRef.current) {
				cancelAnimationFrame(rafIdRef.current);
			}
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
			ortSessionRef.current = null;
			frameQueueRef.current = [];
		};
	}, [processVideoLoop]); // Phụ thuộc vào processVideoLoop

	// =========================================================
	// JSX Render
	// =========================================================
	return (
		<div style={{ padding: "20px", textAlign: "center" }}>
			<h1>Phân tích Sự Tập trung (CNN-LSTM ONNX)</h1>
			<p>
				Sử dụng ONNX Runtime Web để chạy mô hình trực tiếp trong trình
				duyệt.
			</p>

			<div
				style={{
					display: "flex",
					justifyContent: "center",
					gap: "20px",
				}}
			>
				{/* Video Element: Hiển thị camera */}
				<video
					ref={videoRef}
					autoPlay
					muted
					playsInline
					width="320"
					height="240"
					style={{
						border: "1px solid #007bff",
						transform: "scaleX(-1)", // Lật hình ảnh
					}}
				/>

				{/* Canvas Element: Ẩn, dùng để xử lý frame 224x224 */}
				<canvas
					ref={canvasRef}
					width={INPUT_W}
					height={INPUT_H}
					style={{ display: "none" }}
				/>
			</div>

			{/* Khu vực hiển thị kết quả */}
			<div
				style={{
					marginTop: "30px",
					border: "1px solid #ccc",
					padding: "15px",
					maxWidth: "600px",
					margin: "30px auto",
				}}
			>
				<strong>Trạng thái:</strong>{" "}
				<span
					style={{
						color: status.startsWith("LỖI")
							? "red"
							: status.startsWith("✅")
							? "green"
							: "gray",
					}}
				>
					{status}
				</span>
				{prediction && (
					<div style={{ marginTop: "15px", textAlign: "left" }}>
						<h3>
							Dự đoán Hiện tại:{" "}
							<span style={{ color: "darkred" }}>
								{prediction.label}
							</span>
						</h3>

						{prediction.probabilities.map((item, index) => (
							<div key={index} style={{ marginBottom: "5px" }}>
								<strong>{item.label}:</strong> {item.percentage}
								%
								<div
									style={{
										height: "8px",
										backgroundColor: "#f1f1f1",
										borderRadius: "4px",
										marginTop: "2px",
									}}
								>
									<div
										style={{
											width: `${item.percentage}%`,
											height: "100%",
											backgroundColor:
												index ===
												CLASS_LABELS.indexOf(
													prediction.label
												)
													? "#007bff"
													: "#007bff40",
											borderRadius: "4px",
										}}
									></div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
