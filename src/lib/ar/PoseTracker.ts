/**
 * Production-Grade PoseTracker Subsystem using @mediapipe/tasks-vision
 * 
 * Features:
 * - GPU Delegate PoseLandmarker with VIDEO mode & 0.65 confidence thresholds
 * - Time-synchronized frame detection via performance.now()
 * - 6-DOF 1-Euro adaptive filtering across all active torso & arm landmarks
 * - Soft fade-in / fade-out opacity transition when subject leaves/enters frame
 */

import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { OneEuroFilter3D } from "./OneEuroFilter";

export interface Landmark3D {
  x: number; // Normalized [0, 1] horizontal position
  y: number; // Normalized [0, 1] vertical position
  z: number; // Relative depth
  visibility?: number;
  presence?: number;
}

export interface KeyLandmarkSet {
  leftShoulder: Landmark3D;
  rightShoulder: Landmark3D;
  leftElbow: Landmark3D;
  rightElbow: Landmark3D;
  leftWrist: Landmark3D;
  rightWrist: Landmark3D;
  leftHip: Landmark3D;
  rightHip: Landmark3D;
  midShoulder: Landmark3D;
  midHip: Landmark3D;
  neckBase: Landmark3D;
}

export interface SmoothedPoseData {
  rawLandmarks: Landmark3D[];
  keyLandmarks: KeyLandmarkSet;
  isPosePresent: boolean;
  visibilityOpacity: number; // Smooth 0.0 -> 1.0 transition for mesh fading
  shoulderWidth: number;     // 2D distance
  torsoHeight: number;       // 2D distance
  confidence: number;        // Average landmark visibility score
  timestamp: number;
}

export type PoseTrackerCallback = (poseData: SmoothedPoseData) => void;

// MediaPipe Landmark Index Constants
export const POSE_INDEX = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
} as const;

export class PoseTracker {
  private landmarker: PoseLandmarker | null = null;
  private isInitializing = false;
  private isReady = false;
  private animFrameId: number | null = null;

  // 1-Euro Filters per key landmark
  private filters: Map<string, OneEuroFilter3D> = new Map();

  // Smooth visibility transition
  private currentOpacity = 0.0;
  private targetOpacity = 0.0;

  constructor() {
    this.initFilters();
  }

  private initFilters(): void {
    const keys = [
      "leftShoulder", "rightShoulder",
      "leftElbow", "rightElbow",
      "leftWrist", "rightWrist",
      "leftHip", "rightHip",
      "midShoulder", "midHip", "neckBase"
    ];
    for (const key of keys) {
      this.filters.set(key, new OneEuroFilter3D({ minCutoff: 1.0, beta: 0.007, dCutoff: 1.0 }));
    }
  }

  /**
   * Initialize MediaPipe PoseLandmarker with GPU delegate and high confidence thresholds
   */
  public async initialize(): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      // Attempt GPU delegate first, fallback to CPU if unsupported
      try {
        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.65,
          minPosePresenceConfidence: 0.65,
          minTrackingConfidence: 0.65,
        });
      } catch (gpuErr) {
        console.warn("[PoseTracker] GPU delegate failed, falling back to CPU:", gpuErr);
        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.65,
          minPosePresenceConfidence: 0.65,
          minTrackingConfidence: 0.65,
        });
      }

      this.isReady = true;
      this.isInitializing = false;
      console.log("[PoseTracker] MediaPipe PoseLandmarker initialized successfully.");
      return true;
    } catch (err) {
      console.error("[PoseTracker] Failed to initialize MediaPipe PoseLandmarker:", err);
      this.isInitializing = false;
      return false;
    }
  }

  /**
   * Process a single video frame and return 1-Euro filtered landmark output
   */
  public processVideoFrame(
    video: HTMLVideoElement,
    timestampMs: number = performance.now()
  ): SmoothedPoseData | null {
    if (!this.landmarker || !this.isReady || video.readyState < 2) {
      this.updateOpacity(false);
      return null;
    }

    try {
      const result = this.landmarker.detectForVideo(video, timestampMs);

      if (!result.worldLandmarks || result.worldLandmarks.length === 0 || !result.landmarks || result.landmarks.length === 0) {
        this.updateOpacity(false);
        return this.createEmptyPose(timestampMs);
      }

      const raw = result.landmarks[0];
      if (raw.length < 25) {
        this.updateOpacity(false);
        return this.createEmptyPose(timestampMs);
      }

      // Check key landmark confidence
      const ls = raw[POSE_INDEX.LEFT_SHOULDER];
      const rs = raw[POSE_INDEX.RIGHT_SHOULDER];
      const lh = raw[POSE_INDEX.LEFT_HIP];
      const rh = raw[POSE_INDEX.RIGHT_HIP];

      const avgConfidence = ((ls.visibility ?? 1) + (rs.visibility ?? 1) + (lh.visibility ?? 1) + (rh.visibility ?? 1)) / 4;
      const isPresent = avgConfidence >= 0.45;

      this.updateOpacity(isPresent);

      // Compute centroids
      const midShoulderRaw: Landmark3D = {
        x: (ls.x + rs.x) / 2,
        y: (ls.y + rs.y) / 2,
        z: (ls.z + rs.z) / 2,
      };

      const midHipRaw: Landmark3D = {
        x: (lh.x + rh.x) / 2,
        y: (lh.y + rh.y) / 2,
        z: (lh.z + rh.z) / 2,
      };

      const neckBaseRaw: Landmark3D = {
        x: midShoulderRaw.x,
        y: midShoulderRaw.y - 0.05,
        z: midShoulderRaw.z,
      };

      const le = raw[POSE_INDEX.LEFT_ELBOW] || ls;
      const re = raw[POSE_INDEX.RIGHT_ELBOW] || rs;
      const lw = raw[POSE_INDEX.LEFT_WRIST] || le;
      const rw = raw[POSE_INDEX.RIGHT_WRIST] || re;

      // Filter each key landmark with 1-Euro Filter
      const keyLandmarks: KeyLandmarkSet = {
        leftShoulder: this.filters.get("leftShoulder")!.filter(ls, timestampMs),
        rightShoulder: this.filters.get("rightShoulder")!.filter(rs, timestampMs),
        leftElbow: this.filters.get("leftElbow")!.filter(le, timestampMs),
        rightElbow: this.filters.get("rightElbow")!.filter(re, timestampMs),
        leftWrist: this.filters.get("leftWrist")!.filter(lw, timestampMs),
        rightWrist: this.filters.get("rightWrist")!.filter(rw, timestampMs),
        leftHip: this.filters.get("leftHip")!.filter(lh, timestampMs),
        rightHip: this.filters.get("rightHip")!.filter(rh, timestampMs),
        midShoulder: this.filters.get("midShoulder")!.filter(midShoulderRaw, timestampMs),
        midHip: this.filters.get("midHip")!.filter(midHipRaw, timestampMs),
        neckBase: this.filters.get("neckBase")!.filter(neckBaseRaw, timestampMs),
      };

      const shoulderWidth = Math.hypot(
        keyLandmarks.leftShoulder.x - keyLandmarks.rightShoulder.x,
        keyLandmarks.leftShoulder.y - keyLandmarks.rightShoulder.y
      );

      const torsoHeight = Math.hypot(
        keyLandmarks.midShoulder.x - keyLandmarks.midHip.x,
        keyLandmarks.midShoulder.y - keyLandmarks.midHip.y
      );

      return {
        rawLandmarks: raw,
        keyLandmarks,
        isPosePresent: isPresent,
        visibilityOpacity: this.currentOpacity,
        shoulderWidth,
        torsoHeight,
        confidence: avgConfidence,
        timestamp: timestampMs,
      };
    } catch (err) {
      console.warn("[PoseTracker] Frame processing error:", err);
      this.updateOpacity(false);
      return this.createEmptyPose(timestampMs);
    }
  }

  private updateOpacity(isPresent: boolean): void {
    this.targetOpacity = isPresent ? 1.0 : 0.0;
    // Exponential smoothing for soft fade (approx ~120ms fade in/out)
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * 0.12;
  }

  private createEmptyPose(timestampMs: number): SmoothedPoseData {
    const dummy: Landmark3D = { x: 0.5, y: 0.5, z: 0 };
    return {
      rawLandmarks: [],
      keyLandmarks: {
        leftShoulder: dummy,
        rightShoulder: dummy,
        leftElbow: dummy,
        rightElbow: dummy,
        leftWrist: dummy,
        rightWrist: dummy,
        leftHip: dummy,
        rightHip: dummy,
        midShoulder: dummy,
        midHip: dummy,
        neckBase: dummy,
      },
      isPosePresent: false,
      visibilityOpacity: this.currentOpacity,
      shoulderWidth: 0,
      torsoHeight: 0,
      confidence: 0,
      timestamp: timestampMs,
    };
  }

  public reset(): void {
    this.filters.forEach((filter) => {
      filter.reset();
    });
    this.currentOpacity = 0.0;
    this.targetOpacity = 0.0;
  }

  public destroy(): void {
    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
    }
    this.isReady = false;
  }
}
