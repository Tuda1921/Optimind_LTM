"use client";

import React, { useRef, useEffect, useState } from "react";
import { FocusEstimator } from "@/lib/focus-estimator";

interface VideoEngagementAnalyzerProps {
  onScoreUpdate?: (score: number) => void;
  isActive?: boolean;
}

export default function VideoEngagementAnalyzer({ onScoreUpdate, isActive = true }: VideoEngagementAnalyzerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>("Đang khởi tạo...");
  const [engaged, setEngaged] = useState<boolean | null>(null);
  const [focusScore, setFocusScore] = useState<number>(100);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const focusEstimatorRef = useRef<FocusEstimator>(new FocusEstimator());

  // Rule: Nếu mắt nhìn vào camera và không chớp mắt quá nhiều => Engaged
  function evaluateEngagement(score: number): boolean {
    return score >= 65; // Giảm từ 70 -> 65 (phù hợp với penalty mới nghiêm ngặt hơn)
  }

  useEffect(() => {
    let stream: MediaStream | null = null;
    let faceMesh: any = null;
    let animationId: number | null = null;
    let lastScoreUpdateTime = 0;
    const SCORE_UPDATE_INTERVAL = 1000; // 1 giây

    const startCamera = async () => {
      try {
        console.log("[Engagement] Đang yêu cầu quyền truy cập camera...");
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 60 },
            facingMode: "user",
          },
        });
        console.log("[Engagement] Đã truy cập camera thành công", stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log("[Engagement] Đã gán stream cho videoRef");
        }
        setStatus("Đã bật camera, đang tải Mediapipe...");
        await loadFaceMesh();
      } catch (e) {
        console.error("[Engagement] Lỗi truy cập camera:", e);
        setStatus("LỖI: Không truy cập được camera. Vui lòng cấp quyền.");
      }
    };

    // Tải Mediapipe Tasks Vision FaceLandmarker (tránh lỗi Module.arguments)
    const loadFaceMesh = async () => {
      try {
        console.log("[Engagement] Khởi tạo FaceLandmarker (tasks-vision)...");
        const vision = await import("@mediapipe/tasks-vision" as const);
        const { FilesetResolver, FaceLandmarker } = vision as any;
        if (!FilesetResolver || !FaceLandmarker) {
          console.error("[Engagement] Không tìm thấy FaceLandmarker trong tasks-vision", vision);
          setStatus("LỖI: FaceLandmarker không khả dụng");
          return;
        }

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        faceMesh = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });

        setupFaceMesh();
      } catch (err) {
        console.error("[Engagement] Lỗi load FaceLandmarker:", err);
        setStatus("LỖI: Không khởi tạo được FaceLandmarker");
      }
    };

    const setupFaceMesh = () => {
      console.log("[Engagement] FaceLandmarker sẵn sàng, bắt đầu nhận diện...");
      setStatus("Đã tải Mediapipe, đang nhận diện khuôn mặt...");
      startProcessing();
    };

    const startProcessing = () => {
      console.log("[Engagement] Bắt đầu vòng lặp nhận diện khuôn mặt...");
      animationId = requestAnimationFrame(processFrame);
    };

    const processFrame = async () => {
      if (videoRef.current && faceMesh) {
        const video = videoRef.current;
        const now = performance.now();
        const result = await faceMesh.detectForVideo(video, now);
        onResults(result);
      } else {
        console.log("[Engagement] Không có videoRef hoặc faceMesh để gửi frame");
      }
      animationId = requestAnimationFrame(processFrame);
    };

    const onResults = (results: any) => {
      const faces = results?.faceLandmarks || [];
      if (!faces.length) {
        console.log("[Engagement] Không nhận diện được khuôn mặt");
        setStatus("Không nhận diện được khuôn mặt");
        setEngaged(null);
        return;
      }
      const faceLandmarks = faces[0];
      
      // Tính điểm tập trung bằng FocusEstimator (mỗi frame để tích lũy data)
      const score = focusEstimatorRef.current.estimate(faceLandmarks);
      
      // Chỉ cập nhật UI mỗi 1 giây
      const now = Date.now();
      if (now - lastScoreUpdateTime >= SCORE_UPDATE_INTERVAL) {
        lastScoreUpdateTime = now;
        
        setFocusScore(score);
        
        // Đánh giá trạng thái tập trung
        const isEngaged = evaluateEngagement(score);
        setEngaged(isEngaged);
        setStatus(isEngaged ? `Đang tập trung (${score}/100)` : `Không tập trung (${score}/100)`);
        if (onScoreUpdate) onScoreUpdate(score);
        
        console.log("[Engagement] Cập nhật điểm:", score);
      }

      // Vẽ landmarks lên canvas (mỗi frame để mượt)
      if (canvasRef.current && videoRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          // Vẽ landmarks
          const isEngaged = evaluateEngagement(score);
          ctx.fillStyle = isEngaged ? "#00ff00" : "#ff0000";
          faceLandmarks.forEach((lm: any) => {
            ctx.beginPath();
            if (canvasRef.current) {
              ctx.arc(lm.x * canvasRef.current.width, lm.y * canvasRef.current.height, 2, 0, 2 * Math.PI);
            }
            ctx.fill();
          });
        }
      }
    };

    startCamera();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [isActive, onScoreUpdate]);

  return (
    <div style={{ position: "relative", width: 1920, height: 1080 }}>
      <video
        ref={videoRef}  
        style={{ display: "none" }}
        autoPlay
        playsInline
      />
    </div>
  );
}
