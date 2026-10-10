"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import FitVisionLogo from "../common/FitVisionLogo";

// ─── Stage 1: Individual letters drop in ──────────────────────────────────────
const SPRING: [number, number, number, number] = [0.16, 1, 0.3, 1];

const letterVariants = {
  hidden: { opacity: 0, y: -40, rotateX: -90 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.7,
      ease: SPRING,
    },
  }),
};

// ─── Stage 2: SVG arc stroke draws around the emblem ──────────────────────────
const arcVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.1, delay: 0.8, ease: SPRING },
  },
};

// ─── Stage 3: Tagline fades up ────────────────────────────────────────────────
const taglineVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, delay: 1.8, ease: SPRING },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: 2.4, ease: SPRING },
  },
};

export default function LogoEntrance() {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (inView) controls.start("visible");
  }, [inView, controls]);

  const letters = ["F", "i", "t", "V", "i", "s", "i", "o", "n"];

  return (
    <div ref={ref} className="relative flex flex-col items-center select-none">
      {/* ── Stage 1: Kinetic wordmark ─────────────────────────────────────────── */}
      <div className="relative flex items-center gap-0" aria-label="FitVision">
        {/* SVG chrome emblem behind the 'FV' */}
        <div className="relative mr-4">
          {/* Outer ring SVG */}
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            fill="none"
            className="absolute inset-0"
            aria-hidden="true"
          >
            {/* ── Chrome background disc ── */}
            <circle
              cx="36"
              cy="36"
              r="34"
              fill="url(#chrome-fill)"
              stroke="url(#chrome-stroke)"
              strokeWidth="1.5"
            />
            {/* ── Stage 2: animated arc stroke ── */}
            <motion.circle
              cx="36"
              cy="36"
              r="34"
              stroke="url(#cobalt-arc)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="213.6"
              variants={arcVariants}
              initial="hidden"
              animate={controls}
            />
            {/* ── Decorative tick marks ── */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <motion.line
                key={deg}
                x1={36 + 30 * Math.cos((deg * Math.PI) / 180)}
                y1={36 + 30 * Math.sin((deg * Math.PI) / 180)}
                x2={36 + 34 * Math.cos((deg * Math.PI) / 180)}
                y2={36 + 34 * Math.sin((deg * Math.PI) / 180)}
                stroke="#2563EB"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 + i * 0.05, duration: 0.3 }}
              />
            ))}
            <defs>
              <radialGradient id="chrome-fill" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="60%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </radialGradient>
              <linearGradient id="chrome-stroke" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#CBD5E1" />
                <stop offset="50%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
              <linearGradient id="cobalt-arc" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>

          {/* 3D Metallic FV Logo Image inside emblem with Error Boundary Fallback */}
          <div className="w-[72px] h-[72px] flex items-center justify-center relative z-10 p-1">
            <FitVisionLogo variant="hero" size="lg" />
          </div>
        </div>

        {/* Letter-by-letter wordmark */}
        <div className="flex" style={{ perspective: "600px" }}>
          {letters.map((letter, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={letterVariants}
              initial="hidden"
              animate={controls}
              className={`font-black tracking-[-0.04em] leading-none ${
                i < 3
                  ? "text-[56px] text-fv-obsidian"
                  : "text-[56px] text-cobalt-gradient"
              }`}
              style={{
                fontFamily: "var(--font-inter)",
                display: "inline-block",
                // chromatic aberration on V letter
                ...(letter === "V" && i === 3
                  ? {
                      background:
                        "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }
                  : {}),
              }}
            >
              {letter}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Shimmer underline */}
      <motion.div
        className="mt-3 h-px w-64"
        style={{
          background:
            "linear-gradient(90deg, transparent, #2563EB, transparent)",
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* ── Stage 3: Tagline ─────────────────────────────────────────────────── */}
      <motion.p
        variants={taglineVariants}
        initial="hidden"
        animate={controls}
        className="mt-4 text-base font-medium text-fv-muted tracking-[0.18em] uppercase"
      >
        AR Try-On Infrastructure
      </motion.p>

      {/* ── Stage 3b: Version badge ───────────────────────────────────────────── */}
      <motion.div
        variants={badgeVariants}
        initial="hidden"
        animate={controls}
        className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide"
        style={{
          background: "rgba(37,99,235,0.08)",
          border: "1px solid rgba(37,99,235,0.20)",
          color: "#2563EB",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full bg-fv-cobalt animate-pulse"
          style={{ animationDuration: "1.4s" }}
        />
        v2.0 · Hackathon Edition
      </motion.div>
    </div>
  );
}
