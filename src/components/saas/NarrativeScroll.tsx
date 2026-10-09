"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Camera, Cpu, Layers, Zap, ShoppingBag, TrendingUp } from "lucide-react";

interface Frame {
  id: number;
  step: string;
  headline: string;
  body: string;
  icon: React.ReactNode;
  accent: string;
  detail: string;
}

const frames: Frame[] = [
  {
    id: 1,
    step: "01",
    headline: "Customer Opens Your Storefront",
    body: "The FitVision widget loads invisibly — two script lines. Zero configuration, zero DevOps. The entire AR runtime bundles into your existing page as a 340 KB WebAssembly module.",
    icon: <ShoppingBag className="w-6 h-6" />,
    accent: "#2563EB",
    detail: "340 KB WASM · < 120ms cold start",
  },
  {
    id: 2,
    step: "02",
    headline: "Camera Activates, Pose Detected Instantly",
    body: "MediaPipe PoseLandmarker runs entirely in-browser on WebAssembly with optional WebGPU acceleration. 33 body landmarks tracked at 60 fps. No video ever leaves the device.",
    icon: <Camera className="w-6 h-6" />,
    accent: "#7C3AED",
    detail: "33 landmarks · 60 fps · WebGPU accelerated",
  },
  {
    id: 3,
    step: "03",
    headline: "Garment Isolated via Client-Side AI",
    body: "Product JPEGs are pre-downscaled to 512px max via offscreen Canvas, then passed through @imgly/background-removal WASM segmentation. Transparent PNG textures are cached in memory.",
    icon: <Layers className="w-6 h-6" />,
    accent: "#0891B2",
    detail: "< 800ms segmentation · in-memory cache",
  },
  {
    id: 4,
    step: "04",
    headline: "Three.js Meshes Warp to Body Geometry",
    body: "A 16×16 parametric cylindrical mesh is affine-warped using shoulder, chest, and hip landmark vectors. Real-time yaw estimation adjusts texture perspective for depth-aware rendering.",
    icon: <Cpu className="w-6 h-6" />,
    accent: "#059669",
    detail: "16×16 mesh · affine warp · yaw tracking",
  },
  {
    id: 5,
    step: "05",
    headline: "Customer Moves — Garment Tracks",
    body: "Every animation frame recomputes mesh deformation from live pose data. Occlusion culling, depth sorting, and specular highlights create a convincing volumetric fit — not a sticker.",
    icon: <Zap className="w-6 h-6" />,
    accent: "#DC2626",
    detail: "Per-frame mesh deformation · occlusion culling",
  },
  {
    id: 6,
    step: "06",
    headline: "Conversion Lifts. You Keep the Revenue.",
    body: "Studies show AR try-on reduces return rates by 40% and increases add-to-cart conversion by 2.3×. FitVision charges per-API-call — you only pay when it works.",
    icon: <TrendingUp className="w-6 h-6" />,
    accent: "#D97706",
    detail: "−40% returns · +2.3× conversion · pay-per-use",
  },
];

function FrameCard({ frame, index }: { frame: Frame; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isEven ? -40 : 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col md:flex-row items-center gap-8 lg:gap-16 ${
        !isEven ? "md:flex-row-reverse" : ""
      }`}
    >
      {/* Visual card */}
      <div className="flex-1 w-full">
        <div
          className="relative overflow-hidden rounded-2xl p-8 lg:p-10"
          style={{
            background: "white",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 24px rgba(15,23,42,0.07)",
          }}
        >
          {/* Step number watermark */}
          <span
            className="absolute top-4 right-6 text-[80px] font-black leading-none select-none pointer-events-none"
            style={{ color: `${frame.accent}08`, fontFamily: "var(--font-inter)" }}
            aria-hidden="true"
          >
            {frame.step}
          </span>

          {/* Icon with accent blob */}
          <div
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: `${frame.accent}12`,
              border: `1px solid ${frame.accent}25`,
              color: frame.accent,
            }}
          >
            {frame.icon}
            {/* Animated dot */}
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
              style={{ background: frame.accent }}
            />
          </div>

          {/* Step label */}
          <div
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
            style={{ background: `${frame.accent}10`, color: frame.accent }}
          >
            Step {frame.step}
          </div>

          <h3
            className="text-xl lg:text-2xl font-bold text-fv-obsidian mb-3 leading-tight tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {frame.headline}
          </h3>
          <p className="text-[15px] text-fv-slate leading-relaxed mb-5">
            {frame.body}
          </p>

          {/* Metric badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold"
            style={{
              background: `${frame.accent}08`,
              border: `1px solid ${frame.accent}20`,
              color: frame.accent,
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: frame.accent }}
            />
            {frame.detail}
          </div>
        </div>
      </div>

      {/* Connector timeline element */}
      <div className="hidden md:flex flex-col items-center gap-2 flex-shrink-0">
        <motion.div
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black"
          style={{
            background: `linear-gradient(135deg, ${frame.accent} 0%, ${frame.accent}CC 100%)`,
            color: "white",
            boxShadow: `0 4px 16px ${frame.accent}40`,
            fontFamily: "var(--font-inter)",
          }}
        >
          {frame.step}
        </motion.div>
        {index < frames.length - 1 && (
          <motion.div
            className="w-px bg-fv-border"
            initial={{ height: 0 }}
            animate={inView ? { height: 80 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
          />
        )}
      </div>

      {/* Spacer to balance layout */}
      <div className="flex-1 hidden md:block" />
    </motion.div>
  );
}

export default function NarrativeScroll() {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true, margin: "-60px" });

  return (
    <section
      id="how-it-works"
      className="relative py-24 lg:py-36 overflow-hidden"
      style={{ background: "#F8F9FA" }}
      aria-label="How FitVision works"
    >
      {/* Background grid */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-5xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 24 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold mb-6"
            style={{
              background: "rgba(37,99,235,0.08)",
              border: "1px solid rgba(37,99,235,0.18)",
              color: "#2563EB",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-fv-cobalt animate-pulse" />
            6-Step Architecture
          </div>
          <h2
            className="text-4xl lg:text-5xl font-black text-fv-obsidian tracking-[-0.03em] mb-5"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Zero-Cost AR, Zero-Compromise UX
          </h2>
          <p className="text-lg text-fv-muted max-w-2xl mx-auto leading-relaxed">
            Every frame computed on the customer's device. No GPU servers, no video uploads, no latency spikes. Just physics-accurate garment rendering at the edge.
          </p>
        </motion.div>

        {/* 6 frames */}
        <div className="flex flex-col gap-14 lg:gap-20">
          {frames.map((frame, index) => (
            <FrameCard key={frame.id} frame={frame} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
