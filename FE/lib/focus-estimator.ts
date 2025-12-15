/**
 * FocusEstimator Class
 * 
 * Sử dụng MediaPipe Face Mesh (478 landmarks) để đo lường độ tập trung (0-100).
 * 
 * Architecture:
 * 1. Metric Extraction: Tính Head Pose, Eye Gaze, EAR, Stability
 * 2. Scoring Engine: Weighted penalty system (100 - penalties)
 * 3. Calibration: Reference baseline cho mỗi người dùng
 * 4. Smoothing: Exponential Moving Average để tránh giật
 * 
 * Weights:
 * - Head Pose: 40%
 * - Eye Gaze: 30%
 * - Eye Aspect Ratio (EAR): 20%
 * - Stability: 10%
 */

interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface Metrics {
  headPose: { yaw: number; pitch: number; roll: number };
  eyeGaze: { leftOffset: number; rightOffset: number };
  ear: { left: number; right: number };
  stability: number;
}

interface CalibrationData {
  headPoseReference: { yaw: number; pitch: number; roll: number };
  gazeReference: { leftOffset: number; rightOffset: number };
  timestamp: number;
}

export class FocusEstimator {
  // Weights (tổng = 100%)
  private readonly WEIGHT_HEAD_POSE = 0.4;
  private readonly WEIGHT_EYE_GAZE = 0.3;
  private readonly WEIGHT_EAR = 0.2;
  private readonly WEIGHT_STABILITY = 0.1;

  // Thresholds
  private readonly HEAD_POSE_SAFE_ZONE_DEG = 8; // Giảm từ 15 -> 8 (nghiêm ngặt hơn)
  private readonly HEAD_POSE_MAX_PENALTY_DEG = 30; // Giảm từ 45 -> 30
  private readonly GAZE_SAFE_ZONE = 0.08; // Giảm từ 0.15 -> 0.08
  private readonly GAZE_MAX_PENALTY = 0.3; // Giảm từ 0.5 -> 0.3
  private readonly EAR_THRESHOLD = 0.25; // Tăng từ 0.2 -> 0.25 (nhạy hơn)
  private readonly EAR_SLEEP_DURATION_MS = 500; // Giảm từ 1000 -> 500ms (phát hiện buồn ngủ sớm hơn)
  private readonly STABILITY_THRESHOLD = 0.01; // Giảm từ 0.02 -> 0.01 (yêu cầu ổn định hơn)

  // Smoothing
  private readonly EMA_ALPHA = 0.3; // Hệ số EMA (0-1), càng thấp càng mượt
  private smoothedScore = 100;

  // Calibration
  private calibrationData: CalibrationData | null = null;
  private isCalibrated = false;

  // State tracking
  private earLowStartTime: number | null = null; // Thời điểm bắt đầu nhắm mắt
  private nosePositionHistory: { x: number; y: number; z: number; timestamp: number }[] = [];
  private readonly STABILITY_WINDOW_MS = 1000; // Cửa sổ thời gian tính stability

  // =====================================================================
  // LANDMARK INDICES (MediaPipe Face Mesh 478 landmarks)
  // =====================================================================
  private readonly NOSE_TIP = 1;
  private readonly LEFT_EYE_OUTER = 33;
  private readonly LEFT_EYE_INNER = 133;
  private readonly RIGHT_EYE_OUTER = 362;
  private readonly RIGHT_EYE_INNER = 263;
  private readonly LEFT_TRAGUS = 234; // Tai trái
  private readonly RIGHT_TRAGUS = 454; // Tai phải
  private readonly CHIN = 152;
  private readonly FOREHEAD = 10;

  // Eye landmarks cho EAR
  private readonly LEFT_EYE_TOP = 159;
  private readonly LEFT_EYE_BOTTOM = 145;
  private readonly LEFT_EYE_LEFT = 33;
  private readonly LEFT_EYE_RIGHT = 133;

  private readonly RIGHT_EYE_TOP = 386;
  private readonly RIGHT_EYE_BOTTOM = 374;
  private readonly RIGHT_EYE_LEFT = 362;
  private readonly RIGHT_EYE_RIGHT = 263;

  // Iris landmarks (cần refineLandmarks: true)
  private readonly LEFT_IRIS_CENTER = 468;
  private readonly RIGHT_IRIS_CENTER = 473;

  /**
   * Tính khoảng cách Euclidean giữa 2 landmark
   */
  private distance(p1: Landmark, p2: Landmark): number {
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) +
      Math.pow(p2.y - p1.y, 2) +
      Math.pow(p2.z - p1.z, 2)
    );
  }

  /**
   * Tính trung tâm (center) của một nhóm landmarks
   */
  private center(points: Landmark[]): Landmark {
    const sum = points.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y, z: acc.z + p.z }),
      { x: 0, y: 0, z: 0 }
    );
    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
      z: sum.z / points.length,
    };
  }

  // =====================================================================
  // A. HEAD POSE CALCULATION (Yaw, Pitch, Roll)
  // =====================================================================

  /**
   * Tính Head Pose dựa trên tỷ lệ hình học 3D
   * 
   * Yaw (Quay ngang): So sánh khoảng cách từ Mũi đến Tai trái/phải
   * Pitch (Gật/Ngửa): So sánh khoảng cách từ Mũi đến Mắt vs Mũi đến Miệng
   * Roll (Nghiêng): Tính độ lệch của trục ngang mắt
   */
  private calculateHeadPose(landmarks: Landmark[]): { yaw: number; pitch: number; roll: number } {
    const nose = landmarks[this.NOSE_TIP];
    const leftTragus = landmarks[this.LEFT_TRAGUS];
    const rightTragus = landmarks[this.RIGHT_TRAGUS];
    const chin = landmarks[this.CHIN];
    const forehead = landmarks[this.FOREHEAD];
    const leftEye = landmarks[this.LEFT_EYE_OUTER];
    const rightEye = landmarks[this.RIGHT_EYE_OUTER];

    // Yaw: Tỷ lệ khoảng cách mũi -> tai trái / mũi -> tai phải
    // Ratio = 1.0: Nhìn thẳng
    // Ratio > 1.0: Quay phải
    // Ratio < 1.0: Quay trái
    const distNoseToLeft = this.distance(nose, leftTragus);
    const distNoseToRight = this.distance(nose, rightTragus);
    const yawRatio = distNoseToLeft / (distNoseToRight + 1e-6);
    // Convert ratio to degrees (rough approximation)
    // yawRatio = 1.0 -> 0 deg, yawRatio = 1.5 -> ~30 deg
    const yaw = (yawRatio - 1.0) * 60; // Scale factor empirical

    // Pitch: Tỷ lệ khoảng cách mũi -> mắt / mũi -> miệng
    // Ratio > 1.0: Ngửa đầu (nhìn lên)
    // Ratio < 1.0: Gật đầu (nhìn xuống)
    const eyeCenter = this.center([leftEye, rightEye]);
    const distNoseToEye = this.distance(nose, eyeCenter);
    const distNoseToChin = this.distance(nose, chin);
    const pitchRatio = distNoseToEye / (distNoseToChin + 1e-6);
    const pitch = (pitchRatio - 0.5) * 80; // Scale factor empirical

    // Roll: Độ nghiêng của trục ngang qua 2 mắt
    // Tính góc của vector mắt trái -> mắt phải so với trục ngang
    const eyeVectorY = rightEye.y - leftEye.y;
    const eyeVectorX = rightEye.x - leftEye.x;
    const roll = Math.atan2(eyeVectorY, eyeVectorX) * (180 / Math.PI);

    return { yaw, pitch, roll };
  }

  // =====================================================================
  // B. EYE GAZE CALCULATION (Iris Tracking)
  // =====================================================================

  /**
   * Tính độ lệch của mống mắt so với tâm hốc mắt (normalized offset)
   * 
   * Offset = 0: Nhìn thẳng
   * Offset > 0.3: Liếc mắt
   */
  private calculateEyeGaze(landmarks: Landmark[]): { leftOffset: number; rightOffset: number } {
    // Tâm hốc mắt trái
    const leftEyeCenter = this.center([
      landmarks[this.LEFT_EYE_TOP],
      landmarks[this.LEFT_EYE_BOTTOM],
      landmarks[this.LEFT_EYE_LEFT],
      landmarks[this.LEFT_EYE_RIGHT],
    ]);

    // Tâm hốc mắt phải
    const rightEyeCenter = this.center([
      landmarks[this.RIGHT_EYE_TOP],
      landmarks[this.RIGHT_EYE_BOTTOM],
      landmarks[this.RIGHT_EYE_LEFT],
      landmarks[this.RIGHT_EYE_RIGHT],
    ]);

    // Tâm mống mắt
    const leftIris = landmarks[this.LEFT_IRIS_CENTER];
    const rightIris = landmarks[this.RIGHT_IRIS_CENTER];

    // Tính vector offset (normalized by eye width)
    const leftEyeWidth = this.distance(
      landmarks[this.LEFT_EYE_LEFT],
      landmarks[this.LEFT_EYE_RIGHT]
    );
    const rightEyeWidth = this.distance(
      landmarks[this.RIGHT_EYE_LEFT],
      landmarks[this.RIGHT_EYE_RIGHT]
    );

    const leftOffsetX = Math.abs(leftIris.x - leftEyeCenter.x) / (leftEyeWidth + 1e-6);
    const leftOffsetY = Math.abs(leftIris.y - leftEyeCenter.y) / (leftEyeWidth + 1e-6);
    const leftOffset = Math.sqrt(leftOffsetX * leftOffsetX + leftOffsetY * leftOffsetY);

    const rightOffsetX = Math.abs(rightIris.x - rightEyeCenter.x) / (rightEyeWidth + 1e-6);
    const rightOffsetY = Math.abs(rightIris.y - rightEyeCenter.y) / (rightEyeWidth + 1e-6);
    const rightOffset = Math.sqrt(rightOffsetX * rightOffsetX + rightOffsetY * rightOffsetY);

    return { leftOffset, rightOffset };
  }

  // =====================================================================
  // C. EYE ASPECT RATIO (EAR) - Phát hiện nhắm mắt/buồn ngủ
  // =====================================================================

  /**
   * Tính EAR (Eye Aspect Ratio)
   * 
   * EAR = (Chiều dọc mắt) / (Chiều ngang mắt)
   * EAR < 0.2: Mắt nhắm
   * EAR > 0.25: Mắt mở
   */
  private calculateEAR(landmarks: Landmark[]): { left: number; right: number } {
    // Left Eye EAR
    const leftTop = landmarks[this.LEFT_EYE_TOP];
    const leftBottom = landmarks[this.LEFT_EYE_BOTTOM];
    const leftLeft = landmarks[this.LEFT_EYE_LEFT];
    const leftRight = landmarks[this.LEFT_EYE_RIGHT];

    const leftVertical = this.distance(leftTop, leftBottom);
    const leftHorizontal = this.distance(leftLeft, leftRight);
    const leftEAR = leftVertical / (leftHorizontal + 1e-6);

    // Right Eye EAR
    const rightTop = landmarks[this.RIGHT_EYE_TOP];
    const rightBottom = landmarks[this.RIGHT_EYE_BOTTOM];
    const rightLeft = landmarks[this.RIGHT_EYE_LEFT];
    const rightRight = landmarks[this.RIGHT_EYE_RIGHT];

    const rightVertical = this.distance(rightTop, rightBottom);
    const rightHorizontal = this.distance(rightLeft, rightRight);
    const rightEAR = rightVertical / (rightHorizontal + 1e-6);

    return { left: leftEAR, right: rightEAR };
  }

  // =====================================================================
  // D. STABILITY CALCULATION (Độ ổn định của đầu)
  // =====================================================================

  /**
   * Tính độ lệch chuẩn (standard deviation) của vị trí mũi trong 1 giây
   * 
   * Stability cao (SD thấp): Đầu giữ tĩnh -> Tập trung
   * Stability thấp (SD cao): Đầu ngọ nguậy -> Không tập trung
   */
  private calculateStability(landmarks: Landmark[]): number {
    const nose = landmarks[this.NOSE_TIP];
    const now = Date.now();

    // Thêm vị trí hiện tại vào history
    this.nosePositionHistory.push({ x: nose.x, y: nose.y, z: nose.z, timestamp: now });

    // Loại bỏ các entry cũ hơn 1 giây
    this.nosePositionHistory = this.nosePositionHistory.filter(
      (entry) => now - entry.timestamp < this.STABILITY_WINDOW_MS
    );

    // Tính độ lệch chuẩn
    if (this.nosePositionHistory.length < 2) return 0;

    const meanX =
      this.nosePositionHistory.reduce((sum, p) => sum + p.x, 0) / this.nosePositionHistory.length;
    const meanY =
      this.nosePositionHistory.reduce((sum, p) => sum + p.y, 0) / this.nosePositionHistory.length;
    const meanZ =
      this.nosePositionHistory.reduce((sum, p) => sum + p.z, 0) / this.nosePositionHistory.length;

    const variance =
      this.nosePositionHistory.reduce(
        (sum, p) =>
          sum + Math.pow(p.x - meanX, 2) + Math.pow(p.y - meanY, 2) + Math.pow(p.z - meanZ, 2),
        0
      ) / this.nosePositionHistory.length;

    return Math.sqrt(variance); // Standard deviation
  }

  // =====================================================================
  // CALIBRATION (Hiệu chỉnh điểm chuẩn)
  // =====================================================================

  /**
   * Ghi lại trạng thái hiện tại làm điểm chuẩn (Reference)
   * 
   * Người dùng cần nhìn thẳng vào camera trong 3 giây để calibrate
   * Tất cả tính toán sau này sẽ dựa trên Delta so với Reference này
   */
  public calibrate(landmarks: Landmark[]): void {
    const headPose = this.calculateHeadPose(landmarks);
    const eyeGaze = this.calculateEyeGaze(landmarks);

    this.calibrationData = {
      headPoseReference: headPose,
      gazeReference: eyeGaze,
      timestamp: Date.now(),
    };

    this.isCalibrated = true;
    console.log("[FocusEstimator] Calibration completed:", this.calibrationData);
  }

  /**
   * Reset calibration
   */
  public resetCalibration(): void {
    this.calibrationData = null;
    this.isCalibrated = false;
    console.log("[FocusEstimator] Calibration reset");
  }

  // =====================================================================
  // SCORING ENGINE (Weighted Penalty System)
  // =====================================================================

  /**
   * Tính điểm tập trung từ các metrics
   * 
   * Score = 100 - (P_head * W_head) - (P_gaze * W_gaze) - (P_ear * W_ear) - (P_stability * W_stability)
   * 
   * Mỗi penalty là % điểm bị trừ (0-100)
   */
  private calculateScore(metrics: Metrics): number {
    let score = 100;

    // 1. Head Pose Penalty (40%)
    const headPosePenalty = this.calculateHeadPosePenalty(metrics.headPose);
    score -= headPosePenalty * this.WEIGHT_HEAD_POSE * 100;

    // 2. Eye Gaze Penalty (30%)
    const gazePenalty = this.calculateGazePenalty(metrics.eyeGaze);
    score -= gazePenalty * this.WEIGHT_EYE_GAZE * 100;

    // 3. EAR Penalty (20%)
    const earPenalty = this.calculateEARPenalty(metrics.ear);
    score -= earPenalty * this.WEIGHT_EAR * 100;

    // 4. Stability Penalty (10%)
    const stabilityPenalty = this.calculateStabilityPenalty(metrics.stability);
    score -= stabilityPenalty * this.WEIGHT_STABILITY * 100;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Tính penalty từ Head Pose (0-1)
   * 
   * Safe Zone: < 8 độ -> 0 penalty
   * Max Penalty: > 30 độ -> 1.0 penalty
   * Sử dụng hàm mũ để penalty tăng nhanh khi góc lớn
   */
  private calculateHeadPosePenalty(headPose: { yaw: number; pitch: number; roll: number }): number {
    // Tính delta so với reference (nếu đã calibrate)
    let deltaYaw = Math.abs(headPose.yaw);
    let deltaPitch = Math.abs(headPose.pitch);

    if (this.isCalibrated && this.calibrationData) {
      deltaYaw = Math.abs(headPose.yaw - this.calibrationData.headPoseReference.yaw);
      deltaPitch = Math.abs(headPose.pitch - this.calibrationData.headPoseReference.pitch);
    }

    // Tính penalty cho Yaw
    let yawPenalty = 0;
    if (deltaYaw > this.HEAD_POSE_SAFE_ZONE_DEG) {
      const excessYaw = deltaYaw - this.HEAD_POSE_SAFE_ZONE_DEG;
      const normalizedYaw = excessYaw / (this.HEAD_POSE_MAX_PENALTY_DEG - this.HEAD_POSE_SAFE_ZONE_DEG);
      yawPenalty = Math.min(1.0, Math.pow(normalizedYaw, 2.0)); // Tăng từ 1.5 -> 2.0 (penalty tăng nhanh hơn)
    }

    // Tính penalty cho Pitch
    let pitchPenalty = 0;
    if (deltaPitch > this.HEAD_POSE_SAFE_ZONE_DEG) {
      const excessPitch = deltaPitch - this.HEAD_POSE_SAFE_ZONE_DEG;
      const normalizedPitch = excessPitch / (this.HEAD_POSE_MAX_PENALTY_DEG - this.HEAD_POSE_SAFE_ZONE_DEG);
      pitchPenalty = Math.min(1.0, Math.pow(normalizedPitch, 2.0)); // Tăng từ 1.5 -> 2.0
    }

    // Trả về penalty cao nhất giữa Yaw và Pitch
    return Math.max(yawPenalty, pitchPenalty);
  }

  /**
   * Tính penalty từ Eye Gaze (0-1)
   * 
   * Safe Zone: offset < 0.08 -> 0 penalty
   * Max Penalty: offset > 0.3 -> 1.0 penalty
   */
  private calculateGazePenalty(eyeGaze: { leftOffset: number; rightOffset: number }): number {
    // Tính delta so với reference (nếu đã calibrate)
    let leftOffset = eyeGaze.leftOffset;
    let rightOffset = eyeGaze.rightOffset;

    if (this.isCalibrated && this.calibrationData) {
      leftOffset = Math.abs(eyeGaze.leftOffset - this.calibrationData.gazeReference.leftOffset);
      rightOffset = Math.abs(eyeGaze.rightOffset - this.calibrationData.gazeReference.rightOffset);
    }

    // Lấy offset lớn nhất (worst case)
    const maxOffset = Math.max(leftOffset, rightOffset);

    if (maxOffset < this.GAZE_SAFE_ZONE) return 0;

    const excessOffset = maxOffset - this.GAZE_SAFE_ZONE;
    const normalizedOffset = excessOffset / (this.GAZE_MAX_PENALTY - this.GAZE_SAFE_ZONE);
    return Math.min(1.0, Math.pow(normalizedOffset, 1.5)); // Thêm hàm mũ để penalty tăng nhanh hơn
  }

  /**
   * Tính penalty từ EAR (0-1)
   * 
   * Logic:
   * - Nếu EAR < 0.25 trong < 500ms: penalty tăng dần (0-0.5)
   * - Nếu EAR < 0.25 trong > 500ms: 1.0 penalty (ngủ gật)
   * - Nếu EAR < 0.2: penalty gấp đôi (mắt gần như nhắm)
   */
  private calculateEARPenalty(ear: { left: number; right: number }): number {
    const avgEAR = (ear.left + ear.right) / 2;
    const now = Date.now();

    if (avgEAR < this.EAR_THRESHOLD) {
      // Mắt đang nhắm hoặc nửa nhắm
      if (this.earLowStartTime === null) {
        this.earLowStartTime = now;
      }

      const duration = now - this.earLowStartTime;
      
      // Tính base penalty theo thời gian
      let basePenalty = Math.min(1.0, duration / this.EAR_SLEEP_DURATION_MS);
      
      // Nếu mắt gần như nhắm hoàn toàn (EAR < 0.2), penalty gấp đôi
      if (avgEAR < 0.2) {
        basePenalty = Math.min(1.0, basePenalty * 1.5);
      }
      
      return basePenalty;
    } else {
      // Mắt mở -> Reset timer
      this.earLowStartTime = null;
      return 0;
    }
  }

  /**
   * Tính penalty từ Stability (0-1)
   * 
   * SD < 0.01: Rất ổn định -> 0 penalty
   * SD > 0.05: Rất ngọ nguậy -> 1.0 penalty
   */
  private calculateStabilityPenalty(stability: number): number {
    if (stability < this.STABILITY_THRESHOLD) return 0;

    const excessStability = stability - this.STABILITY_THRESHOLD;
    const normalizedStability = excessStability / (0.05 - this.STABILITY_THRESHOLD); // Giảm từ 0.1 -> 0.05
    return Math.min(1.0, Math.pow(normalizedStability, 1.5)); // Thêm hàm mũ để penalty tăng nhanh hơn
  }

  // =====================================================================
  // SMOOTHING (Exponential Moving Average)
  // =====================================================================

  /**
   * Làm mượt điểm số bằng EMA
   * 
   * EMA[t] = α * Score[t] + (1 - α) * EMA[t-1]
   * α = 0.3: Smoothing vừa phải (không quá chậm, không quá giật)
   */
  private smoothScore(rawScore: number): number {
    this.smoothedScore = this.EMA_ALPHA * rawScore + (1 - this.EMA_ALPHA) * this.smoothedScore;
    return this.smoothedScore;
  }

  // =====================================================================
  // PUBLIC API
  // =====================================================================

  /**
   * Tính điểm tập trung từ Face Landmarks của MediaPipe
   * 
   * @param landmarks - Array 478 landmarks từ MediaPipe Face Mesh
   * @returns Điểm tập trung (0-100, đã smooth)
   */
  public estimate(landmarks: Landmark[]): number {
    if (!landmarks || landmarks.length < 478) {
      console.warn("[FocusEstimator] Invalid landmarks (expected 478)");
      return this.smoothedScore; // Trả về điểm cũ nếu input không hợp lệ
    }

    // 1. Trích xuất metrics
    const metrics: Metrics = {
      headPose: this.calculateHeadPose(landmarks),
      eyeGaze: this.calculateEyeGaze(landmarks),
      ear: this.calculateEAR(landmarks),
      stability: this.calculateStability(landmarks),
    };

    // 2. Tính điểm thô
    const rawScore = this.calculateScore(metrics);

    // 3. Làm mượt
    const smoothedScore = this.smoothScore(rawScore);

    return Math.round(smoothedScore);
  }

  /**
   * Lấy metrics chi tiết (dùng cho debug/visualization)
   */
  public getMetrics(landmarks: Landmark[]): Metrics | null {
    if (!landmarks || landmarks.length < 478) return null;

    return {
      headPose: this.calculateHeadPose(landmarks),
      eyeGaze: this.calculateEyeGaze(landmarks),
      ear: this.calculateEAR(landmarks),
      stability: this.calculateStability(landmarks),
    };
  }

  /**
   * Kiểm tra xem đã calibrate chưa
   */
  public isCalibrationReady(): boolean {
    return this.isCalibrated;
  }

  /**
   * Reset toàn bộ state (dùng khi start/stop session)
   */
  public reset(): void {
    this.smoothedScore = 100;
    this.earLowStartTime = null;
    this.nosePositionHistory = [];
    this.resetCalibration();
  }
}
