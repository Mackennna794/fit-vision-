"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Camera,
  Sparkles,
  ShoppingBag,
  Zap,
  Check,
  Download,
  Eye,
  ShieldCheck,
  Palette,
} from "lucide-react";
import { PoseTracker, SmoothedPoseData } from "@/lib/ar/PoseTracker";
import { evaluateSizing } from "@/lib/ar/fitMLModel";

export interface ARProduct {
  id: string;
  name: string;
  category: "top" | "bottom" | "hoodie" | "shirt" | "jacket" | "sweater" | "shoes" | "eyewear";
  price: number;
  image_url: string;
  color?: string;
  description?: string;
  fitStyle?: "tight" | "regular" | "oversized";
  garmentDimensions?: {
    shoulderWidthCm: number;
    chestWidthCm: number;
    lengthCm: number;
    hipWidthCm?: number;
  };
}

const DEMO_GARMENTS: ARProduct[] = [
  {
    id: "g1",
    name: "CyberPunk Oversized Hoodie",
    category: "hoodie",
    price: 129,
    image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80",
    color: "#2563EB",
    fitStyle: "oversized",
  },
  {
    id: "g2",
    name: "Nordic Wool Knit Sweater",
    category: "sweater",
    price: 149,
    image_url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80",
    color: "#708238",
    fitStyle: "regular",
  },
  {
    id: "g3",
    name: "Minimalist Linen Formal Shirt",
    category: "shirt",
    price: 89,
    image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80",
    color: "#4169E1",
    fitStyle: "tight",
  },
  {
    id: "g4",
    name: "AuraTech Tactical Jacket",
    category: "jacket",
    price: 199,
    image_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80",
    color: "#008080",
    fitStyle: "regular",
  },
  {
    id: "g5",
    name: "Tailored Urban Trousers",
    category: "bottom",
    price: 110,
    image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80",
    color: "#800020",
    fitStyle: "regular",
  },
  {
    id: "g6",
    name: "Futuristic Cyber Goggles",
    category: "eyewear",
    price: 79,
    image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80",
    color: "#00F3FF",
    fitStyle: "regular",
  },
];

interface Point2D {
  x: number;
  y: number;
}

interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

interface UniversalTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ARProduct | null;
  onAddToCart?: (product: ARProduct, size: string) => void;
}

// Color Utility: Helper to darken or lighten hex colors
function shadeColor(hex: string, percent: number): string {
  let color = hex.replace("#", "");
  if (color.length === 3) {
    color = color
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(color, 16);
  if (isNaN(num)) return hex;

  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default function UniversalTryOnModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
}: UniversalTryOnModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseTrackerRef = useRef<PoseTracker | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Active product & selection states
  const [activeProduct, setActiveProduct] = useState<ARProduct>(
    product || DEMO_GARMENTS[0]
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    activeProduct.color || "#2563EB"
  );
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);

  // Telemetry HUD state
  const [fps, setFps] = useState<number>(60);
  const [trackingConfidence, setTrackingConfidence] = useState<number>(0);
  const [shoulderCm, setShoulderCm] = useState<number>(45);
  const [torsoCm, setTorsoCm] = useState<number>(62);
  const [recommendedSize, setRecommendedSize] = useState<string>("M");

  // UI Toast & Snapshot states
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState<boolean>(false);

  const lastFpsTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  // Synchronize state when passed product changes
  useEffect(() => {
    if (product) {
      setActiveProduct(product);
      if (product.color) setSelectedColor(product.color);
    }
  }, [product]);

  // ─── 1. Webcam Stream & MediaPipe Pose Tracker Lifecycle ────────────────
  useEffect(() => {
    if (!isOpen) return;

    let stream: MediaStream | null = null;
    const tracker = new PoseTracker();
    poseTrackerRef.current = tracker;
    tracker.initialize();

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }
      } catch (err) {
        console.warn("[AR Engine] Camera access error:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      tracker.destroy();
    };
  }, [isOpen]);

  // ─── 2. ANATOMICAL PROCEDURAL VECTOR RENDERERS ──────────────────────────────
  // T-SHIRT RENDERER
  const drawTShirt = useCallback(
    (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], w: number, h: number, color: string) => {
      const pt = (i: number): Point2D => ({ x: landmarks[i].x * w, y: landmarks[i].y * h });
      const ls = pt(11), rs = pt(12), le = pt(13), re = pt(14), lh = pt(23), rh = pt(24);
      const ms = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
      const mh = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
      const shPx = Math.hypot(rs.x - ls.x, rs.y - ls.y);
      const torsoPx = Math.hypot(mh.x - ms.x, mh.y - ms.y);
      if (shPx < 10) return;

      const borderShade = shadeColor(color, -40);
      const collarShade = shadeColor(color, 25);

      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = borderShade;
      ctx.lineWidth = Math.max(2, Math.round(shPx * 0.035));
      ctx.lineJoin = "round";

      ctx.beginPath();
      const collarY = ms.y - torsoPx * 0.06;
      ctx.moveTo(ls.x, ls.y);
      ctx.quadraticCurveTo(ms.x, collarY + torsoPx * 0.14, rs.x, rs.y);

      // Short Sleeves
      const rSleeveTip = { x: rs.x + (re.x - rs.x) * 0.42, y: rs.y + (re.y - rs.y) * 0.42 };
      ctx.lineTo(rSleeveTip.x, rSleeveTip.y);
      const rArmpit = { x: rs.x + (rh.x - rs.x) * 0.18, y: rs.y + (rh.y - rs.y) * 0.2 };
      ctx.lineTo(rArmpit.x, rArmpit.y);
      ctx.lineTo(rh.x, rh.y);

      // Hemline
      ctx.quadraticCurveTo(mh.x, mh.y + 12, lh.x, lh.y);
      const lArmpit = { x: ls.x + (lh.x - ls.x) * 0.18, y: ls.y + (lh.y - ls.y) * 0.2 };
      ctx.lineTo(lArmpit.x, lArmpit.y);
      const lSleeveTip = { x: ls.x + (le.x - ls.x) * 0.42, y: ls.y + (le.y - ls.y) * 0.42 };
      ctx.lineTo(lSleeveTip.x, lSleeveTip.y);
      ctx.lineTo(ls.x, ls.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Collar Detail
      ctx.beginPath();
      ctx.moveTo(ls.x, ls.y);
      ctx.quadraticCurveTo(ms.x, collarY + torsoPx * 0.16, rs.x, rs.y);
      ctx.strokeStyle = collarShade;
      ctx.lineWidth = Math.max(3, Math.round(shPx * 0.045));
      ctx.stroke();

      ctx.restore();
    },
    []
  );

  // HOODIE RENDERER (With Hood Curve, Kangaroo Pocket, and Drawstrings)
  const drawHoodie = useCallback(
    (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], w: number, h: number, color: string) => {
      const pt = (i: number): Point2D => ({ x: landmarks[i].x * w, y: landmarks[i].y * h });
      const ls = pt(11), rs = pt(12), le = pt(13), re = pt(14), lh = pt(23), rh = pt(24);
      const ms = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
      const mh = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
      const shPx = Math.hypot(rs.x - ls.x, rs.y - ls.y);
      const torsoPx = Math.hypot(mh.x - ms.x, mh.y - ms.y);
      if (shPx < 10) return;

      const darkShade = shadeColor(color, -45);
      const innerHood = shadeColor(color, -25);

      ctx.save();

      // 1. Draw Large Hood Behind Head
      const hoodTop = ms.y - torsoPx * 0.45;
      ctx.fillStyle = innerHood;
      ctx.strokeStyle = darkShade;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ls.x - shPx * 0.1, ls.y);
      ctx.quadraticCurveTo(ls.x - shPx * 0.15, hoodTop, ms.x, hoodTop - 15);
      ctx.quadraticCurveTo(rs.x + shPx * 0.15, hoodTop, rs.x + shPx * 0.1, rs.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 2. Main Hoodie Body & Long Dropped Sleeves
      ctx.fillStyle = color;
      ctx.strokeStyle = darkShade;
      ctx.lineWidth = Math.max(3, Math.round(shPx * 0.04));
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(ls.x, ls.y);
      ctx.quadraticCurveTo(ms.x, ms.y + 10, rs.x, rs.y);

      // Long Sleeves extending near wrists
      ctx.lineTo(re.x + 8, re.y + 15);
      ctx.lineTo(rh.x + 12, rh.y);
      ctx.lineTo(lh.x - 12, lh.y);
      ctx.lineTo(le.x - 8, le.y + 15);
      ctx.lineTo(ls.x, ls.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. Front Kangaroo Pouch Pocket
      const pocketTopY = ms.y + torsoPx * 0.45;
      const pocketBottomY = mh.y + 5;
      const pocketWidth = shPx * 0.55;

      ctx.fillStyle = shadeColor(color, -15);
      ctx.beginPath();
      ctx.moveTo(ms.x - pocketWidth / 2, pocketTopY);
      ctx.lineTo(ms.x + pocketWidth / 2, pocketTopY);
      ctx.lineTo(ms.x + pocketWidth / 2 + 12, pocketBottomY);
      ctx.lineTo(ms.x - pocketWidth / 2 - 12, pocketBottomY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pocket Entry Slits
      ctx.strokeStyle = darkShade;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ms.x - pocketWidth / 2, pocketTopY);
      ctx.lineTo(ms.x - pocketWidth / 2 - 12, pocketBottomY);
      ctx.moveTo(ms.x + pocketWidth / 2, pocketTopY);
      ctx.lineTo(ms.x + pocketWidth / 2 + 12, pocketBottomY);
      ctx.stroke();

      // 4. Dangling Hoodie Drawstrings
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      // Left String
      ctx.moveTo(ms.x - 14, ms.y + 8);
      ctx.quadraticCurveTo(ms.x - 22, ms.y + 40, ms.x - 16, ms.y + torsoPx * 0.3);
      // Right String
      ctx.moveTo(ms.x + 14, ms.y + 8);
      ctx.quadraticCurveTo(ms.x + 22, ms.y + 40, ms.x + 16, ms.y + torsoPx * 0.3);
      ctx.stroke();

      // Drawstring Metal Tips
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(ms.x - 18, ms.y + torsoPx * 0.3, 4, 8);
      ctx.fillRect(ms.x + 14, ms.y + torsoPx * 0.3, 4, 8);

      ctx.restore();
    },
    []
  );

  // FORMAL SHIRT RENDERER (With Pointed Collars & Button Placket)
  const drawFormalShirt = useCallback(
    (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], w: number, h: number, color: string) => {
      const pt = (i: number): Point2D => ({ x: landmarks[i].x * w, y: landmarks[i].y * h });
      const ls = pt(11), rs = pt(12), le = pt(13), re = pt(14), lh = pt(23), rh = pt(24);
      const ms = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
      const mh = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
      const shPx = Math.hypot(rs.x - ls.x, rs.y - ls.y);
      const torsoPx = Math.hypot(mh.x - ms.x, mh.y - ms.y);
      if (shPx < 10) return;

      const darkShade = shadeColor(color, -45);
      const collarColor = shadeColor(color, 35);

      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = darkShade;
      ctx.lineWidth = Math.max(2, Math.round(shPx * 0.035));

      // Main Torso Cut
      ctx.beginPath();
      ctx.moveTo(ls.x, ls.y);
      ctx.lineTo(rs.x, rs.y);
      ctx.lineTo(re.x, re.y);
      ctx.lineTo(rh.x, rh.y);
      ctx.lineTo(lh.x, lh.y);
      ctx.lineTo(le.x, le.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Center Vertical Button Placket
      ctx.fillStyle = shadeColor(color, -12);
      ctx.fillRect(ms.x - 7, ms.y, 14, torsoPx);

      // Buttons down center
      ctx.fillStyle = "#FFFFFF";
      const numButtons = 5;
      for (let b = 1; b <= numButtons; b++) {
        const by = ms.y + (torsoPx / (numButtons + 1)) * b;
        ctx.beginPath();
        ctx.arc(ms.x, by, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#94A3B8";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Crisp Pointed Collar Flaps
      ctx.fillStyle = collarColor;
      ctx.strokeStyle = darkShade;
      ctx.lineWidth = 2;

      // Left Collar Flap
      ctx.beginPath();
      ctx.moveTo(ls.x + 8, ls.y);
      ctx.lineTo(ms.x - 2, ms.y + 24);
      ctx.lineTo(ms.x - 18, ms.y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Collar Flap
      ctx.beginPath();
      ctx.moveTo(rs.x - 8, rs.y);
      ctx.lineTo(ms.x + 2, ms.y + 24);
      ctx.lineTo(ms.x + 18, ms.y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    },
    []
  );

  // JACKET / COAT RENDERER (With Zipper & Wide Open Lapels)
  const drawJacket = useCallback(
    (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], w: number, h: number, color: string) => {
      const pt = (i: number): Point2D => ({ x: landmarks[i].x * w, y: landmarks[i].y * h });
      const ls = pt(11), rs = pt(12), le = pt(13), re = pt(14), lh = pt(23), rh = pt(24);
      const ms = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
      const mh = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
      const shPx = Math.hypot(rs.x - ls.x, rs.y - ls.y);
      const torsoPx = Math.hypot(mh.x - ms.x, mh.y - ms.y);
      if (shPx < 10) return;

      const darkBorder = shadeColor(color, -50);

      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = darkBorder;
      ctx.lineWidth = 4;

      // Broad Jacket Cut
      ctx.beginPath();
      ctx.moveTo(ls.x - 12, ls.y - 4);
      ctx.lineTo(rs.x + 12, rs.y - 4);
      ctx.lineTo(re.x + 10, re.y);
      ctx.lineTo(rh.x + 14, rh.y + 10);
      ctx.lineTo(lh.x - 14, lh.y + 10);
      ctx.lineTo(le.x - 10, le.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Open Folded Wide Lapels
      ctx.fillStyle = shadeColor(color, -25);
      ctx.beginPath();
      ctx.moveTo(ls.x - 12, ls.y - 4);
      ctx.lineTo(ms.x - 25, ms.y + torsoPx * 0.35);
      ctx.lineTo(ms.x - 4, ms.y + torsoPx * 0.35);
      ctx.lineTo(ms.x - 4, ms.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rs.x + 12, rs.y - 4);
      ctx.lineTo(ms.x + 25, ms.y + torsoPx * 0.35);
      ctx.lineTo(ms.x + 4, ms.y + torsoPx * 0.35);
      ctx.lineTo(ms.x + 4, ms.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Metallic Zipper Line down Center
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ms.x, ms.y + torsoPx * 0.35);
      ctx.lineTo(mh.x, mh.y + 10);
      ctx.stroke();

      // Zipper Pull Tab
      ctx.fillStyle = "#94A3B8";
      ctx.fillRect(ms.x - 3, ms.y + torsoPx * 0.4, 6, 12);

      ctx.restore();
    },
    []
  );

  // SWEATER RENDERER (Ribbed Knit Waist & Cuffs)
  const drawSweater = useCallback(
    (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], w: number, h: number, color: string) => {
      const pt = (i: number): Point2D => ({ x: landmarks[i].x * w, y: landmarks[i].y * h });
      const ls = pt(11), rs = pt(12), le = pt(13), re = pt(14), lh = pt(23), rh = pt(24);
      const ms = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
      const mh = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
      const shPx = Math.hypot(rs.x - ls.x, rs.y - ls.y);
      if (shPx < 10) return;

      const darkKnit = shadeColor(color, -35);

      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = darkKnit;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(ls.x, ls.y);
      ctx.lineTo(rs.x, rs.y);
      ctx.lineTo(re.x, re.y);
      ctx.lineTo(rh.x, rh.y);
      ctx.lineTo(lh.x, lh.y);
      ctx.lineTo(le.x, le.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ribbed V-Neck Collar
      ctx.beginPath();
      ctx.moveTo(ls.x + 12, ls.y);
      ctx.lineTo(ms.x, ms.y + 28);
      ctx.lineTo(rs.x - 12, rs.y);
      ctx.strokeStyle = shadeColor(color, 25);
      ctx.lineWidth = 5;
      ctx.stroke();

      // Ribbed Waistband Hem Pattern
      ctx.strokeStyle = darkKnit;
      ctx.lineWidth = 2;
      for (let rx = lh.x; rx <= rh.x; rx += 6) {
        ctx.beginPath();
        ctx.moveTo(rx, lh.y - 12);
        ctx.lineTo(rx, lh.y);
        ctx.stroke();
      }

      ctx.restore();
    },
    []
  );

  // TROUSERS / PANTS RENDERER
  const drawTrousers = useCallback(
    (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], w: number, h: number, color: string) => {
      const pt = (i: number): Point2D => ({ x: landmarks[i].x * w, y: landmarks[i].y * h });
      const lh = pt(23), rh = pt(24), lk = pt(25), rk = pt(26), la = pt(27) || lk, ra = pt(28) || rk;

      const borderShade = shadeColor(color, -40);

      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = borderShade;
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";

      // Left Leg
      ctx.beginPath();
      ctx.moveTo(lh.x, lh.y);
      ctx.lineTo(lk.x - 12, lk.y);
      ctx.lineTo(la.x - 10, la.y);
      ctx.lineTo(la.x + 10, la.y);
      ctx.lineTo(lk.x + 8, lk.y);
      ctx.lineTo((lh.x + rh.x) / 2, (lh.y + rh.y) / 2 + 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Leg
      ctx.beginPath();
      ctx.moveTo(rh.x, rh.y);
      ctx.lineTo(rk.x + 12, rk.y);
      ctx.lineTo(ra.x + 10, ra.y);
      ctx.lineTo(ra.x - 10, ra.y);
      ctx.lineTo(rk.x - 8, rk.y);
      ctx.lineTo((lh.x + rh.x) / 2, (lh.y + rh.y) / 2 + 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Waistband Belt Line
      ctx.strokeStyle = shadeColor(color, -50);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(lh.x, lh.y);
      ctx.lineTo(rh.x, rh.y);
      ctx.stroke();

      ctx.restore();
    },
    []
  );

  // FUTURISTIC EYEWEAR / GOGGLES RENDERER
  const drawEyewear = useCallback(
    (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], w: number, h: number, color: string) => {
      const pt = (i: number): Point2D => ({ x: landmarks[i].x * w, y: landmarks[i].y * h });
      const le = pt(1), re = pt(2), nose = pt(0), earL = pt(7), earR = pt(8);
      const eyeDist = Math.hypot(re.x - le.x, re.y - le.y);
      if (eyeDist < 5) return;

      ctx.save();
      // Metallic Frame
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;

      const gWidth = eyeDist * 2.4;
      const gHeight = eyeDist * 0.9;
      const cx = nose.x;
      const cy = nose.y - 5;

      // Wrap Goggle Frame
      ctx.beginPath();
      ctx.roundRect(cx - gWidth / 2, cy - gHeight / 2, gWidth, gHeight, 10);
      ctx.fill();
      ctx.stroke();

      // Tinted Glass Lenses
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.roundRect(cx - gWidth / 2 + 4, cy - gHeight / 2 + 4, gWidth / 2 - 6, gHeight - 8, 6);
      ctx.roundRect(cx + 2, cy - gHeight / 2 + 4, gWidth / 2 - 6, gHeight - 8, 6);
      ctx.fill();

      // Ear Stems
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - gWidth / 2, cy);
      ctx.lineTo(earL.x, earL.y);
      ctx.moveTo(cx + gWidth / 2, cy);
      ctx.lineTo(earR.x, earR.y);
      ctx.stroke();

      ctx.restore();
    },
    []
  );

  // SKELETAL LANDMARKS VISUALIZER
  const drawSkeleton = useCallback(
    (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], w: number, h: number) => {
      const pt = (i: number): Point2D => ({ x: landmarks[i].x * w, y: landmarks[i].y * h });
      const BONES: [number, number][] = [
        [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
        [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
      ];

      ctx.save();
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;

      for (const [i, j] of BONES) {
        if (landmarks[i] && landmarks[j]) {
          const p1 = pt(i), p2 = pt(j);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = "#22d3ee";
      const JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
      for (const idx of JOINTS) {
        if (landmarks[idx]) {
          const p = pt(idx);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    },
    []
  );

  // ─── 3. Main Frame Render Loop ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const renderLoop = (timestamp: number) => {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);

      frameCountRef.current++;
      if (timestamp - lastFpsTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (timestamp - lastFpsTimeRef.current)));
        frameCountRef.current = 0;
        lastFpsTimeRef.current = timestamp;
      }

      if (!canvasRef.current || !videoRef.current || !poseTrackerRef.current || videoRef.current.readyState < 2) {
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const video = videoRef.current;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      const w = canvas.width;
      const h = canvas.height;

      // Draw mirrored webcam feed (CSS scaleX(-1))
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(video, 0, 0, w, h);

      // Process MediaPipe landmarks
      const poseData: SmoothedPoseData | null = poseTrackerRef.current.processVideoFrame(video, timestamp);

      if (poseData && poseData.isPosePresent && poseData.rawLandmarks && poseData.rawLandmarks.length >= 25) {
        setTrackingConfidence(Math.round(poseData.confidence * 100));

        const lm = poseData.rawLandmarks;
        const ls = lm[11], rs = lm[12], lh = lm[23], rh = lm[24];
        const shPx = Math.hypot((rs.x - ls.x) * w, (rs.y - ls.y) * h);
        const torsoPx = Math.hypot(((lh.x + rh.x) / 2 - (ls.x + rs.x) / 2) * w, ((lh.y + rh.y) / 2 - (ls.y + rs.y) / 2) * h);

        const cmPerPx = 172 / Math.max(1, torsoPx / 0.3);
        const shCm = Math.round(shPx * cmPerPx * 10) / 10;
        const trCm = Math.round(torsoPx * cmPerPx * 10) / 10;

        setShoulderCm(Math.max(32, Math.min(62, shCm)));
        setTorsoCm(Math.max(35, Math.min(80, trCm)));

        // Fit Analysis Recommendation
        const sizing = evaluateSizing(
          { shoulderWidthCm: 45, chestWidthCm: 104, lengthCm: 72, isTop: activeProduct.category !== "bottom" },
          { shoulderCm: shCm, hipCm: shCm * 0.85, torsoCm: trCm, chestCm: shCm * 2.2, userHeightCm: 172, userWeightKg: 68, bmi: 23, cmPerPx }
        );
        setRecommendedSize(sizing.size);

        // Branching Garment Vector Renderer
        const cat = activeProduct.category;
        if (cat === "hoodie") {
          drawHoodie(ctx, lm, w, h, selectedColor);
        } else if (cat === "shirt") {
          drawFormalShirt(ctx, lm, w, h, selectedColor);
        } else if (cat === "jacket") {
          drawJacket(ctx, lm, w, h, selectedColor);
        } else if (cat === "sweater") {
          drawSweater(ctx, lm, w, h, selectedColor);
        } else if (cat === "bottom") {
          drawTrousers(ctx, lm, w, h, selectedColor);
        } else if (cat === "eyewear") {
          drawEyewear(ctx, lm, w, h, selectedColor);
        } else {
          drawTShirt(ctx, lm, w, h, selectedColor);
        }

        // Draw Skeletal Landmarks
        if (showSkeleton) {
          drawSkeleton(ctx, lm, w, h);
        }
      } else {
        setTrackingConfidence(0);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [
    isOpen,
    selectedColor,
    showSkeleton,
    activeProduct,
    drawTShirt,
    drawHoodie,
    drawFormalShirt,
    drawJacket,
    drawSweater,
    drawTrousers,
    drawEyewear,
    drawSkeleton,
  ]);

  // ─── 4. Snapshot & Cart Actions ──────────────────────────────────────────
  const handleCaptureSnapshot = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = canvasRef.current.width;
    snapCanvas.height = canvasRef.current.height;
    const ctx = snapCanvas.getContext("2d");
    if (!ctx) return;

    ctx.translate(snapCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, snapCanvas.width, snapCanvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.drawImage(canvasRef.current, 0, 0, snapCanvas.width, snapCanvas.height);

    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(20, snapCanvas.height - 60, 360, 40);
    ctx.fillStyle = "#00F3FF";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("FITVISION AR • VERIFIED TRY-ON", 35, snapCanvas.height - 35);

    setSnapshotUrl(snapCanvas.toDataURL("image/png"));
  };

  const handleSelectProduct = (item: ARProduct) => {
    setActiveProduct(item);
    if (item.color) setSelectedColor(item.color);
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(activeProduct, recommendedSize);
    }
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-6xl h-[92vh] max-h-[860px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        >
          <video ref={videoRef} playsInline muted autoPlay className="hidden" />

          {/* Top Control Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm z-20">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    FitVision AR Virtual Try-On
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE CAMERA MIRROR
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Real-time landmark tracking • Structural vector fitting ({activeProduct.category.toUpperCase()})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label
                id="cSkel"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={showSkeleton}
                  onChange={(e) => setShowSkeleton(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Show landmarks</span>
              </label>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close AR Try-On Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Viewport Area */}
          <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center">
            <canvas
              id="cv"
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full object-contain -scale-x-100"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* HUD Overlay Panels (Telemetry & Garment Customizer) */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2.5 pointer-events-auto">
              {/* Telemetry Card */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-slate-200 shadow-xl text-xs font-mono space-y-2 w-64">
                <div className="flex items-center justify-between text-slate-500 font-sans font-semibold text-[11px] pb-1.5 border-b border-slate-100">
                  <span className="flex items-center gap-1 text-slate-900 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Tracking Telemetry
                  </span>
                  <span className="text-emerald-600 font-bold">{fps} FPS</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Landmark Lock:</span>
                  <span className="font-bold text-slate-900">{trackingConfidence}%</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shoulder Span:</span>
                  <span className="font-bold text-blue-600">{shoulderCm} cm</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Torso Length:</span>
                  <span className="font-bold text-slate-900">{torsoCm} cm</span>
                </div>
              </div>

              {/* Size Recommendation */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-slate-200 shadow-xl text-xs w-64">
                <div className="flex items-center gap-1.5 text-blue-600 font-bold mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Real-Time Fit Analysis</span>
                </div>
                <div className="mt-2 flex items-center justify-between bg-blue-50/80 border border-blue-200 px-3 py-2 rounded-xl">
                  <span className="text-[11px] text-blue-900 font-semibold">Optimal Fit:</span>
                  <span className="text-xs font-black text-blue-700 bg-white px-2.5 py-0.5 rounded-lg shadow-xs">
                    Size {recommendedSize}
                  </span>
                </div>
              </div>

              {/* Garment Color Swatch Selector */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-slate-200 shadow-xl text-xs w-64 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 uppercase tracking-wider">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  Try-On Garment Color
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "#2563EB", "#708238", "#4169E1", "#008080",
                    "#800020", "#301934", "#E2725B", "#097969", "#00F3FF",
                  ].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setSelectedColor(hex)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        selectedColor.toLowerCase() === hex.toLowerCase()
                          ? "border-blue-600 scale-110 shadow-sm ring-2 ring-blue-400/40"
                          : "border-white hover:scale-105"
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Added Toast */}
            {addedToast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Added {activeProduct.name} ({recommendedSize}) to cart!</span>
              </motion.div>
            )}

            {/* Snapshot Modal */}
            {snapshotUrl && (
              <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-slate-200 flex flex-col items-center">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    AR Fit Snapshot
                  </h3>
                  <div className="w-full rounded-2xl overflow-hidden border border-slate-200 mb-4 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={snapshotUrl} alt="Fit Capture" className="w-full h-auto" />
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    <a
                      href={snapshotUrl}
                      download={`fitvision-${activeProduct.name.toLowerCase().replace(/\s+/g, "-")}.png`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Save Photo
                    </a>
                    <button
                      type="button"
                      onClick={() => setSnapshotUrl(null)}
                      className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Catalog & Actions */}
          <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                Catalog:
              </span>
              {DEMO_GARMENTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectProduct(item)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl border text-xs transition-all ${
                    activeProduct.id === item.id
                      ? "border-blue-600 bg-blue-50/60 text-blue-900 font-semibold shadow-xs"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg overflow-hidden bg-white border border-slate-200 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="truncate max-w-[110px] font-medium">{item.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Camera className="w-4 h-4 text-slate-500" />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-blue-500/25"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart • ${activeProduct.price}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
