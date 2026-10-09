"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import {
  RotateCcw,
  Sliders,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Download,
  Layers,
  Shirt,
  Cpu,
} from "lucide-react";
import { PoseTracker, SmoothedPoseData } from "@/lib/ar/PoseTracker";
import { OccluderManager } from "@/lib/ar/OccluderManager";
import { GarmentFitter, GarmentCalibration } from "@/lib/ar/GarmentFitter";
import { DeformableGarmentEngine } from "@/lib/ar/DeformableGarmentEngine";

export interface ARProductOption {
  id: string;
  name: string;
  category: "apparel" | "headwear" | "eyewear" | "accessory";
  glbUrl?: string;
  textureUrl?: string;
  imageUrl?: string;
  previewUrl?: string;
  colorHex?: string;
}

const DEFAULT_PRODUCTS: ARProductOption[] = [
  {
    id: "cobalt-tshirt",
    name: "Cobalt Tech Tee (3D / 2D Deformable)",
    category: "apparel",
    colorHex: "#2563EB",
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80",
    previewUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80",
  },
  {
    id: "black-hoodie",
    name: "Obsidian Heavyweight Hoodie",
    category: "apparel",
    colorHex: "#0F172A",
    imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80",
    previewUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80",
  },
  {
    id: "emerald-jacket",
    name: "Emerald Waterproof Shell",
    category: "apparel",
    colorHex: "#059669",
    imageUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?w=500&q=80",
    previewUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?w=500&q=80",
  },
  {
    id: "denim-overshirt",
    name: "Vintage Wash Denim Shirt",
    category: "apparel",
    colorHex: "#3B82F6",
    imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&q=80",
    previewUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&q=80",
  },
];

interface ARViewProps {
  selectedProduct?: ARProductOption;
  onClose?: () => void;
}

export default function ARView({ selectedProduct: initialProduct, onClose }: ARViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Core AR Systems
  const poseTrackerRef = useRef<PoseTracker | null>(null);
  const occluderManagerRef = useRef<OccluderManager | null>(null);
  const garmentFitterRef = useRef<GarmentFitter | null>(null);
  const deformableEngineRef = useRef<DeformableGarmentEngine | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // States
  const [activeProduct, setActiveProduct] = useState<ARProductOption>(
    initialProduct || DEFAULT_PRODUCTS[0]
  );
  const [fitEngineMode, setFitEngineMode] = useState<"3d-webgl" | "2d-deformable">("3d-webgl");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [fps, setFps] = useState<number>(60);
  const [confidence, setConfidence] = useState<number>(0);
  const [isPoseDetected, setIsPoseDetected] = useState<boolean>(false);
  const [showControls, setShowControls] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calibration state
  const [calibration, setCalibration] = useState<GarmentCalibration>({
    scaleMultiplier: 1.0,
    offsetY: 0.0,
    offsetZ: 0.0,
    chestWidthMultiplier: 1.0,
  });

  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const animFrameIdRef = useRef<number | null>(null);

  // ─── 1. Initialize Subsystems ─────────────────────────────────────────────
  useEffect(() => {
    if (!webglCanvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 1280;
    const height = containerRef.current.clientHeight || 720;

    // Three.js Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 2.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: webglCanvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(0, 1.5, 2);
    scene.add(ambientLight, dirLight);

    // Initialize Occluder & Garment Fitter
    const occluder = new OccluderManager();
    occluderManagerRef.current = occluder;
    scene.add(occluder.group);

    const garmentFitter = new GarmentFitter();
    garmentFitterRef.current = garmentFitter;
    scene.add(garmentFitter.sceneGroup);

    // Initialize 2D Deformable Garment Engine
    const deformableEngine = new DeformableGarmentEngine();
    deformableEngineRef.current = deformableEngine;
    const imgUrl = activeProduct.textureUrl || activeProduct.imageUrl || activeProduct.previewUrl;
    if (imgUrl) {
      deformableEngine.loadGarmentImage(imgUrl);
    }

    // Initialize PoseTracker
    const tracker = new PoseTracker();
    poseTrackerRef.current = tracker;
    tracker.initialize();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);

      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = w;
        overlayCanvasRef.current.height = h;
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      tracker.destroy();
      occluder.destroy();
      garmentFitter.destroy();
      renderer.dispose();
    };
  }, []);

  // ─── 2. Handle Product Selection Changes ─────────────────────────────────
  useEffect(() => {
    const imgUrl = activeProduct.textureUrl || activeProduct.imageUrl || activeProduct.previewUrl;
    if (imgUrl) {
      deformableEngineRef.current?.loadGarmentImage(imgUrl);
    }
    if (garmentFitterRef.current) {
      if (activeProduct.glbUrl) {
        garmentFitterRef.current.loadGLTF(activeProduct.glbUrl, activeProduct.textureUrl);
      } else {
        garmentFitterRef.current.createProceduralGarment(imgUrl);
      }
    }
  }, [activeProduct]);

  // ─── 3. Calibration Updates ───────────────────────────────────────────────
  useEffect(() => {
    if (garmentFitterRef.current) {
      garmentFitterRef.current.setCalibration(calibration);
    }
  }, [calibration]);

  // ─── 4. Camera Stream Handler ─────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraActive(true);
        };
      }
    } catch (err: any) {
      console.error("[ARView] Webcam permission or access error:", err);
      setErrorMessage("Camera permission denied. Please enable webcam access for live AR fitting.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // ─── 5. High-Performance Frame Render Loop ────────────────────────────────
  useEffect(() => {
    const renderLoop = (timestamp: number) => {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);

      // FPS Calculation
      frameCountRef.current++;
      if (timestamp - lastFpsTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (timestamp - lastFpsTimeRef.current)));
        frameCountRef.current = 0;
        lastFpsTimeRef.current = timestamp;
      }

      if (!poseTrackerRef.current || !videoRef.current) return;

      const overlayCanvas = overlayCanvasRef.current;
      const overlayCtx = overlayCanvas?.getContext("2d");
      const canvasW = overlayCanvas?.width || 1280;
      const canvasH = overlayCanvas?.height || 720;

      if (overlayCtx && overlayCanvas) {
        overlayCtx.clearRect(0, 0, canvasW, canvasH);
      }

      // Process MediaPipe PoseLandmarker frame
      const poseData: SmoothedPoseData | null = poseTrackerRef.current.processVideoFrame(
        videoRef.current,
        timestamp
      );

      if (poseData && poseData.isPosePresent && poseData.visibilityOpacity > 0.05) {
        setIsPoseDetected(true);
        setConfidence(Math.round(poseData.confidence * 100));

        if (fitEngineMode === "3d-webgl") {
          // ─── 3D WebGL Skeletal Mesh & Coordinate Mapping Mode ─────────────
          if (overlayCtx && overlayCanvas) overlayCtx.clearRect(0, 0, canvasW, canvasH);

          const camera = cameraRef.current;
          if (camera && garmentFitterRef.current && occluderManagerRef.current) {
            const landmarksToWorld = (lm: { x: number; y: number; z: number }): THREE.Vector3 => {
              const ndcX = (0.5 - lm.x) * 2;
              const ndcY = -(lm.y - 0.5) * 2;
              const depthZ = 0.5 + (lm.z || 0) * 0.3;
              return new THREE.Vector3(ndcX, ndcY, depthZ).unproject(camera);
            };

            occluderManagerRef.current.updateFromLandmarks(poseData.keyLandmarks, landmarksToWorld);
            garmentFitterRef.current.updateFitting(
              poseData.keyLandmarks,
              landmarksToWorld,
              poseData.visibilityOpacity
            );
          }
        } else {
          // ─── 2D Piecewise Affine Warped Deformable Garment Mode ───────────
          if (garmentFitterRef.current) garmentFitterRef.current.sceneGroup.visible = false;
          if (occluderManagerRef.current) occluderManagerRef.current.setVisible(false);

          if (deformableEngineRef.current && overlayCtx) {
            const ctrlPts = deformableEngineRef.current.computeControlPoints(
              poseData.rawLandmarks,
              canvasW,
              canvasH,
              true
            );

            if (ctrlPts) {
              deformableEngineRef.current.renderDeformedGarment(
                overlayCtx,
                ctrlPts,
                poseData.visibilityOpacity
              );
            }
          }
        }
      } else {
        setIsPoseDetected(false);
        if (garmentFitterRef.current) garmentFitterRef.current.sceneGroup.visible = false;
        if (occluderManagerRef.current) occluderManagerRef.current.setVisible(false);
      }

      // Render WebGL frame
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [fitEngineMode]);

  // ─── 6. Snapshot Capture ──────────────────────────────────────────────────
  const captureSnapshot = () => {
    if (!videoRef.current || !overlayCanvasRef.current) return;
    const offscreen = document.createElement("canvas");
    offscreen.width = videoRef.current.videoWidth || 1280;
    offscreen.height = videoRef.current.videoHeight || 720;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    // Draw video background mirrored
    ctx.translate(offscreen.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, offscreen.width, offscreen.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Draw WebGL and 2D overlay layers
    if (webglCanvasRef.current) {
      ctx.drawImage(webglCanvasRef.current, 0, 0, offscreen.width, offscreen.height);
    }
    if (overlayCanvasRef.current) {
      ctx.drawImage(overlayCanvasRef.current, 0, 0, offscreen.width, offscreen.height);
    }

    const dataUrl = offscreen.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `FitVision_${fitEngineMode}_TryOn_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[600px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center border border-slate-800"
    >
      {/* ─── Webcam Video Background ────────────────────────────────────── */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none"
      />

      {/* ─── WebGL Canvas Layer (3D Mode) ───────────────────────────────── */}
      <canvas
        ref={webglCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* ─── 2D Canvas Layer (Piecewise Affine Mesh Mode) ────────────────── */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-15"
      />

      {/* ─── Top Control Header & Engine Switcher ───────────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            {fitEngineMode === "3d-webgl" ? "3D WebGL Rig Engine" : "2D Affine Mesh Warping"}
          </span>
          <span className="text-xs text-slate-400 font-mono pl-1 border-l border-slate-700">
            {fps} FPS
          </span>
        </div>

        {/* Engine Selector Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-full border border-slate-700 shadow-md">
            <button
              onClick={() => setFitEngineMode("3d-webgl")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                fitEngineMode === "3d-webgl"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>3D WebGL Rig</span>
            </button>

            <button
              onClick={() => setFitEngineMode("2d-deformable")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                fitEngineMode === "2d-deformable"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>2D Kinematic Mesh</span>
            </button>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border ${
              isPoseDetected
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
            }`}
          >
            {isPoseDetected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>3D Body Bound ({confidence}%)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>Step into frame</span>
              </>
            )}
          </div>

          <button
            onClick={() => setShowControls(!showControls)}
            className="p-2 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-700 hover:bg-slate-800 transition-colors"
            title="Fine-Tune Fitting Calibration"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-300 text-xs font-bold border border-slate-700 hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* ─── Error Notification ─────────────────────────────────────────── */}
      {errorMessage && (
        <div className="absolute inset-x-6 top-20 z-30 bg-rose-950/90 border border-rose-600/50 text-rose-200 p-4 rounded-xl backdrop-blur-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={startCamera}
            className="px-3 py-1 bg-rose-700 hover:bg-rose-600 rounded-lg text-xs font-bold transition-colors"
          >
            Retry Camera
          </button>
        </div>
      )}

      {/* ─── Product Carousel (Bottom) ─────────────────────────────────── */}
      <div className="absolute bottom-6 inset-x-4 z-20 flex flex-col items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl border border-slate-800 shadow-2xl max-w-xl overflow-x-auto">
          {DEFAULT_PRODUCTS.map((prod) => {
            const isSelected = activeProduct.id === prod.id;
            return (
              <button
                key={prod.id}
                onClick={() => setActiveProduct(prod)}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                    : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                  style={{ backgroundColor: prod.colorHex || "#2563EB" }}
                />
                <span className="text-xs font-semibold whitespace-nowrap">{prod.name}</span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={captureSnapshot}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Take Snapshot
          </button>

          <button
            onClick={() =>
              setCalibration({
                scaleMultiplier: 1.0,
                offsetY: 0.0,
                offsetZ: 0.0,
                chestWidthMultiplier: 1.0,
              })
            }
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-300 text-xs font-semibold border border-slate-700 hover:bg-slate-800 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Rig
          </button>
        </div>
      </div>

      {/* ─── Calibration Drawer Side Panel ──────────────────────────────── */}
      {showControls && (
        <div className="absolute right-4 top-20 z-30 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-2xl text-slate-200 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              Rig Calibration
            </h4>
            <button
              onClick={() => setShowControls(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 text-xs font-medium">
            <div>
              <div className="flex justify-between mb-1 text-slate-300">
                <span>Scale Multiplier</span>
                <span>{calibration.scaleMultiplier.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.02"
                value={calibration.scaleMultiplier}
                onChange={(e) =>
                  setCalibration((prev) => ({
                    ...prev,
                    scaleMultiplier: parseFloat(e.target.value),
                  }))
                }
                className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
