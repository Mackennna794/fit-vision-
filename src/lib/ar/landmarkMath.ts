/**
 * FitVision Volumetric AR Engine — Landmark Mathematics & Mesh Deformation
 * 
 * Computes:
 * - Real-time 3D Torso Pose (Center, Width, Height, Yaw via shoulder disparity, Roll, Pitch)
 * - Headwear Pose (Eye center, IPD, Roll, Yaw)
 * - Exponential Moving Average (EMA) Temporal Smoothing
 * - 16x16 Curved Parametric Cylindrical Torso Mesh Deformation
 */

import * as THREE from "three";

export interface Landmark {
  x: number; // [0, 1] normalized screen space (horizontal)
  y: number; // [0, 1] normalized screen space (vertical)
  z: number; // roughly relative depth
  visibility?: number;
}

export interface TorsoPose {
  center: { x: number; y: number; z: number };
  shoulderCenter: { x: number; y: number; z: number };
  hipCenter: { x: number; y: number; z: number };
  leftShoulder: { x: number; y: number; z: number };
  rightShoulder: { x: number; y: number; z: number };
  leftHip: { x: number; y: number; z: number };
  rightHip: { x: number; y: number; z: number };
  shoulderWidth: number;
  hipWidth: number;
  torsoHeight: number;
  yaw: number; // in radians (-π/2 to π/2)
  roll: number; // in radians
  pitch: number; // in radians
  confidence: number;
}

export interface HeadPose {
  center: { x: number; y: number; z: number };
  eyeDistance: number;
  roll: number;
  yaw: number;
  pitch: number;
  confidence: number;
}

// MediaPipe Landmark Index Constants
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
} as const;

/**
 * Computes Euclidean distance between two 3D points
 */
export function distance3D(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/**
 * Computes 2D Euclidean distance (screen projection)
 */
export function distance2D(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Extracts and computes Torso metrics and 3D rotational pose
 */
export function computeTorsoPose(landmarks: Landmark[]): TorsoPose | null {
  if (!landmarks || landmarks.length < 25) return null;

  const ls = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rs = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const lh = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rh = landmarks[POSE_LANDMARKS.RIGHT_HIP];

  // Verify landmark visibility/presence
  const minVis = Math.min(
    ls.visibility ?? 1,
    rs.visibility ?? 1,
    lh.visibility ?? 1,
    rh.visibility ?? 1
  );

  const shoulderCenter = {
    x: (ls.x + rs.x) / 2,
    y: (ls.y + rs.y) / 2,
    z: (ls.z + rs.z) / 2,
  };

  const hipCenter = {
    x: (lh.x + rh.x) / 2,
    y: (lh.y + rh.y) / 2,
    z: (lh.z + rh.z) / 2,
  };

  const center = {
    x: (shoulderCenter.x + hipCenter.x) / 2,
    y: (shoulderCenter.y + hipCenter.y) / 2,
    z: (shoulderCenter.z + hipCenter.z) / 2,
  };

  const shoulderWidth = distance2D(ls, rs);
  const hipWidth = distance2D(lh, rh);
  const torsoHeight = distance2D(shoulderCenter, hipCenter);

  if (shoulderWidth < 0.05 || torsoHeight < 0.05) {
    return null; // Pose not recognizable or subject too distant
  }

  // ─── Real-Time Yaw Rotation via Shoulder Disparity ───────────────────────────
  // MediaPipe z-coordinates: smaller z means closer to camera.
  // When user rotates body, shoulder disparity (rs.z - ls.z) reflects yaw.
  // We normalize disparity relative to 2D shoulder span for scale invariance.
  const zDisparity = (rs.z - ls.z);
  const rawYawRatio = zDisparity / Math.max(0.01, shoulderWidth * 1.2);
  const clampedYawRatio = Math.max(-1, Math.min(1, rawYawRatio));
  const yaw = Math.asin(clampedYawRatio); // Radians: positive = turned left, negative = turned right

  // ─── Roll Rotation (tilt in image plane) ─────────────────────────────────────
  // Angle of shoulder vector relative to horizontal axis
  const roll = Math.atan2(rs.y - ls.y, rs.x - ls.x);

  // ─── Pitch Rotation (forward/backward lean) ──────────────────────────────────
  const verticalDeltaZ = hipCenter.z - shoulderCenter.z;
  const pitchRatio = Math.max(-1, Math.min(1, verticalDeltaZ / Math.max(0.01, torsoHeight)));
  const pitch = Math.asin(pitchRatio) * 0.5;

  return {
    center,
    shoulderCenter,
    hipCenter,
    leftShoulder: ls,
    rightShoulder: rs,
    leftHip: lh,
    rightHip: rh,
    shoulderWidth,
    hipWidth,
    torsoHeight,
    yaw,
    roll,
    pitch,
    confidence: minVis,
  };
}

/**
 * Extracts and computes Head/Face metrics for Eyewear & Headwear
 */
export function computeHeadPose(landmarks: Landmark[]): HeadPose | null {
  if (!landmarks || landmarks.length < 9) return null;

  const le = landmarks[POSE_LANDMARKS.LEFT_EYE];
  const re = landmarks[POSE_LANDMARKS.RIGHT_EYE];
  const nose = landmarks[POSE_LANDMARKS.NOSE];

  const minVis = Math.min(le.visibility ?? 1, re.visibility ?? 1, nose.visibility ?? 1);

  const center = {
    x: (le.x + re.x) / 2,
    y: (le.y + re.y) / 2,
    z: (le.z + re.z) / 2,
  };

  const eyeDistance = distance2D(le, re);
  if (eyeDistance < 0.02) return null;

  const roll = Math.atan2(re.y - le.y, re.x - le.x);
  const zDisparity = (re.z - le.z) / Math.max(0.01, eyeDistance * 1.5);
  const yaw = Math.asin(Math.max(-1, Math.min(1, zDisparity)));
  const pitch = (nose.y - center.y) * 2;

  return {
    center,
    eyeDistance,
    roll,
    yaw,
    pitch,
    confidence: minVis,
  };
}

/**
 * Temporal Exponential Moving Average (EMA) smoothing to eliminate frame jitter
 */
export function smoothTorsoPose(
  current: TorsoPose,
  previous: TorsoPose | null,
  alpha = 0.35 // 0 = retain old, 1 = instant jump. 0.35 provides silky 60fps responsiveness
): TorsoPose {
  if (!previous) return current;

  const lerp = (curr: number, prev: number) => prev + alpha * (curr - prev);
  const lerp3D = (
    c: { x: number; y: number; z: number },
    p: { x: number; y: number; z: number }
  ) => ({
    x: lerp(c.x, p.x),
    y: lerp(c.y, p.y),
    z: lerp(c.z, p.z),
  });

  return {
    center: lerp3D(current.center, previous.center),
    shoulderCenter: lerp3D(current.shoulderCenter, previous.shoulderCenter),
    hipCenter: lerp3D(current.hipCenter, previous.hipCenter),
    leftShoulder: lerp3D(current.leftShoulder, previous.leftShoulder),
    rightShoulder: lerp3D(current.rightShoulder, previous.rightShoulder),
    leftHip: lerp3D(current.leftHip, previous.leftHip),
    rightHip: lerp3D(current.rightHip, previous.rightHip),
    shoulderWidth: lerp(current.shoulderWidth, previous.shoulderWidth),
    hipWidth: lerp(current.hipWidth, previous.hipWidth),
    torsoHeight: lerp(current.torsoHeight, previous.torsoHeight),
    yaw: lerp(current.yaw, previous.yaw),
    roll: lerp(current.roll, previous.roll),
    pitch: lerp(current.pitch, previous.pitch),
    confidence: current.confidence,
  };
}

/**
 * 16x16 Cylindrical Mesh Torso Deformation
 * 
 * Takes a Three.js PlaneGeometry with (segmentsX = 15, segmentsY = 15) -> 16x16 = 256 vertices.
 * Shapes vertices into an anatomically curved cylinder that matches:
 * 1. Top-to-bottom trapezoidal torso tapering (shoulders -> hips)
 * 2. Radial cylindrical chest curvature (arch wrapping around torso)
 * 3. Dynamic real-time yaw rotation around the body axis
 * 4. Proper 3D normal re-computation for specular highlights
 */
export function deformCylindricalMesh(
  geometry: THREE.PlaneGeometry,
  pose: TorsoPose,
  options?: {
    curvatureArc?: number; // Arc angle in radians (default ~1.15 rad = 66 deg)
    depthExtrusion?: number; // Z curvature depth factor
    fitAllowance?: number; // Multiplier on width for garment drape (default 1.35)
  }
): void {
  const positionAttr = geometry.attributes.position;
  if (!positionAttr) return;

  const curvatureArc = options?.curvatureArc ?? 1.15;
  const depthExtrusion = options?.depthExtrusion ?? 0.22;
  const fitAllowance = options?.fitAllowance ?? 1.35;

  // Grid dimensions for PlaneGeometry(width, height, 15, 15)
  const cols = 16;
  const rows = 16;

  const topWidth = pose.shoulderWidth * fitAllowance;
  const bottomWidth = Math.max(topWidth * 0.85, pose.hipWidth * fitAllowance * 1.05);
  const totalHeight = pose.torsoHeight * 1.25;

  const yawCos = Math.cos(pose.yaw);
  const yawSin = Math.sin(pose.yaw);

  for (let r = 0; r < rows; r++) {
    // row 0 is top (shoulders), row 15 is bottom (hem)
    const v = r / (rows - 1); // 0 (top) to 1 (bottom)
    const currentRowWidth = topWidth * (1 - v) + bottomWidth * v;
    const yPos = (0.5 - v) * totalHeight;

    for (let c = 0; c < cols; c++) {
      const u = c / (cols - 1); // 0 (left) to 1 (right)
      const vertexIndex = r * cols + c;

      // Parametric arc angle across chest: [-arc/2, +arc/2]
      const theta = (u - 0.5) * curvatureArc;

      // Cylindrical arch calculations
      const radius = currentRowWidth / (2 * Math.sin(curvatureArc / 2));
      const rawX = radius * Math.sin(theta);
      // Arch curve backward at sides (negative Z moves back away from camera)
      const rawZ = -radius * (1 - Math.cos(theta)) * depthExtrusion;

      // ─── Apply Yaw Rotation around torso vertical axis ────────────────────
      const rotatedX = rawX * yawCos - rawZ * yawSin;
      const rotatedZ = rawX * yawSin + rawZ * yawCos;

      positionAttr.setXYZ(vertexIndex, rotatedX, yPos, rotatedZ);
    }
  }

  positionAttr.needsUpdate = true;
  geometry.computeVertexNormals();
}
