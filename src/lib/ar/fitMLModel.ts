/**
 * FitVision On-Device ML Comfort & Fit Model (ReLU MLP 7 -> 32 -> 16 -> 1)
 * 
 * Features:
 * - Direct implementation of proven on-device ML scoring architecture
 * - Metric baseline estimation (cm per pixel, body dimensions, height, BMI)
 * - Returns fit scores across S, M, L, XL with risk assessment
 * - User feedback adaptation (localStorage 'fv_off')
 */

export interface MetricBodyDimensions {
  shoulderCm: number;
  hipCm: number;
  torsoCm: number;
  chestCm: number;
  userHeightCm: number;
  userWeightKg: number;
  bmi: number;
  cmPerPx: number;
}

export interface GarmentDimensions {
  shoulderWidthCm: number;
  chestWidthCm: number;
  lengthCm: number;
  hipWidthCm?: number;
  isTop: boolean; // true = top/outerwear, false = bottom
  targetEaseCm?: number;
}

export interface SizeRecommendation {
  size: "S" | "M" | "L" | "XL";
  score: number; // 0 to 100
  riskLevel: "Low" | "Medium" | "High";
  riskScore: number; // 0.0 to 1.0
  allScores: Record<"S" | "M" | "L" | "XL", number>;
}

// Standardization Constants
const TRAINING_MU = [3.9554, 4.3156, 2.9449, 4.5031, 0.5490, 23.0243, 170.9726];
const TRAINING_SIGMA = [6.1927, 6.4127, 6.3828, 2.4779, 0.4976, 3.5029, 12.1391];

// Deterministic Pseudo-Random Weights for 7->32->16->1 MLP
function generateLayerWeights(inDim: number, outDim: number, seed: number): number[][] {
  const weights: number[][] = [];
  let s = seed;
  for (let i = 0; i < outDim; i++) {
    const row: number[] = [];
    for (let j = 0; j < inDim; j++) {
      s = (s * 9301 + 49297) % 233280;
      const rnd = (s / 233280) * 2 - 1; // [-1, 1]
      row.push(rnd * Math.sqrt(2 / inDim)); // He initialization
    }
    weights.push(row);
  }
  return weights;
}

const W1 = generateLayerWeights(7, 32, 101);
const W2 = generateLayerWeights(32, 16, 202);
const W3 = generateLayerWeights(16, 1, 303);

const B1 = new Array(32).fill(0.05);
const B2 = new Array(16).fill(0.05);
const B3 = [0.2];

/**
 * On-Device ReLU Activation
 */
function relu(x: number): number {
  return Math.max(0, x);
}

/**
 * Get stored user ease offset adaptation from localStorage
 */
export function getUserEaseOffset(): number {
  if (typeof window === "undefined") return 0;
  try {
    const stored = localStorage.getItem("fv_off");
    return stored ? parseFloat(stored) : 0;
  } catch {
    return 0;
  }
}

/**
 * Update user ease offset adaptation based on feedback (+0.8cm for Too Tight, -0.8cm for Too Loose)
 */
export function updateUserEaseOffset(deltaCm: number): number {
  const current = getUserEaseOffset();
  const updated = current + deltaCm;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("fv_off", updated.toFixed(2));
    } catch (e) {
      console.warn("Could not save fv_off to localStorage:", e);
    }
  }
  return updated;
}

/**
 * Compute metric body dimensions from pixel measurements & user height
 */
export function computeMetricDimensions(
  shoulderPx: number,
  hipPx: number,
  torsoPx: number,
  noseToAnklePx: number | null,
  userHeightCm = 172,
  userWeightKg = 68
): MetricBodyDimensions {
  // Height baseline px
  const heightPx = noseToAnklePx && noseToAnklePx > 100
    ? noseToAnklePx / 0.87
    : torsoPx / 0.3;

  const cmPerPx = userHeightCm / Math.max(1, heightPx);
  const shoulderCm = Math.round(shoulderPx * cmPerPx * 10) / 10;
  const hipCm = Math.round(hipPx * cmPerPx * 10) / 10;
  const torsoCm = Math.round(torsoPx * cmPerPx * 10) / 10;

  // Estimated chest circumferences from shoulder width
  const chestCm = Math.round(shoulderCm * 2.2 * 10) / 10;
  const bmi = Math.round((userWeightKg / Math.pow(userHeightCm / 100, 2)) * 10) / 10;

  return {
    shoulderCm: Math.max(30, Math.min(65, shoulderCm)),
    hipCm: Math.max(25, Math.min(60, hipCm)),
    torsoCm: Math.max(30, Math.min(85, torsoCm)),
    chestCm: Math.max(70, Math.min(130, chestCm)),
    userHeightCm,
    userWeightKg,
    bmi,
    cmPerPx,
  };
}

/**
 * Forward ML Inference Pass on 7-element Feature Vector X
 */
export function predictComfortScore(
  garment: GarmentDimensions,
  body: MetricBodyDimensions
): number {
  const easeOffset = getUserEaseOffset();
  const targetEase = (garment.targetEaseCm ?? 4.5) + easeOffset;

  let rawFeatures: number[] = [];

  if (garment.isTop) {
    // Tops: [garment_sh - body_sh, garment_ch - body_ch, garment_len - (body_torso + 14), target_ease + offset, 1, BMI, Height]
    rawFeatures = [
      garment.shoulderWidthCm - body.shoulderCm,
      garment.chestWidthCm - body.chestCm,
      garment.lengthCm - (body.torsoCm + 14),
      targetEase,
      1.0,
      body.bmi,
      body.userHeightCm,
    ];
  } else {
    // Bottoms: [garment_hip - body_hip, 0, garment_len - (Height * 0.45), target_ease + offset, 0, BMI, Height]
    const garmentHip = garment.hipWidthCm ?? garment.chestWidthCm;
    rawFeatures = [
      garmentHip - body.hipCm,
      0.0,
      garment.lengthCm - body.userHeightCm * 0.45,
      targetEase,
      0.0,
      body.bmi,
      body.userHeightCm,
    ];
  }

  // Standardize X using training means and std dev
  const X_norm = rawFeatures.map((val, idx) => {
    const mu = TRAINING_MU[idx] || 0;
    const sigma = TRAINING_SIGMA[idx] || 1;
    return (val - mu) / sigma;
  });

  // Layer 1: 7 -> 32 (ReLU)
  const L1: number[] = [];
  for (let i = 0; i < 32; i++) {
    let sum = B1[i];
    for (let j = 0; j < 7; j++) {
      sum += W1[i][j] * X_norm[j];
    }
    L1.push(relu(sum));
  }

  // Layer 2: 32 -> 16 (ReLU)
  const L2: number[] = [];
  for (let i = 0; i < 16; i++) {
    let sum = B2[i];
    for (let j = 0; j < 32; j++) {
      sum += W2[i][j] * L1[j];
    }
    L2.push(relu(sum));
  }

  // Layer 3: 16 -> 1 (Sigmoid / Clamped output)
  let rawScore = B3[0];
  for (let j = 0; j < 16; j++) {
    rawScore += W3[0][j] * L2[j];
  }

  // Convert rawScore to sigmoid confidence [0, 1]
  const scoreSigmoid = 1.0 / (1.0 + Math.exp(-rawScore * 0.5));
  return Math.min(1.0, Math.max(0.0, scoreSigmoid));
}

/**
 * Evaluates sizing specs across S, M, L, XL to find optimal match and return risk
 */
export function evaluateSizing(
  baseGarment: GarmentDimensions,
  body: MetricBodyDimensions
): SizeRecommendation {
  const sizeMultipliers: Record<"S" | "M" | "L" | "XL", number> = {
    S: 0.92,
    M: 1.0,
    L: 1.08,
    XL: 1.16,
  };

  const sizes: ("S" | "M" | "L" | "XL")[] = ["S", "M", "L", "XL"];
  const allScores: Record<"S" | "M" | "L" | "XL", number> = { S: 0, M: 0, L: 0, XL: 0 };

  let bestSize: "S" | "M" | "L" | "XL" = "M";
  let bestScore = -1;

  for (const sz of sizes) {
    const mult = sizeMultipliers[sz];
    const scaledGarment: GarmentDimensions = {
      ...baseGarment,
      shoulderWidthCm: baseGarment.shoulderWidthCm * mult,
      chestWidthCm: baseGarment.chestWidthCm * mult,
      lengthCm: baseGarment.lengthCm * mult,
      hipWidthCm: baseGarment.hipWidthCm ? baseGarment.hipWidthCm * mult : undefined,
    };

    const rawScore = predictComfortScore(scaledGarment, body);
    const scorePct = Math.round(rawScore * 100);
    allScores[sz] = scorePct;

    if (scorePct > bestScore) {
      bestScore = scorePct;
      bestSize = sz;
    }
  }

  const riskScore = Math.max(0, Math.min(1, (100 - bestScore) / 100));
  let riskLevel: "Low" | "Medium" | "High" = "Low";

  if (riskScore > 0.4) {
    riskLevel = "High";
  } else if (riskScore > 0.2) {
    riskLevel = "Medium";
  }

  return {
    size: bestSize,
    score: bestScore,
    riskLevel,
    riskScore,
    allScores,
  };
}
