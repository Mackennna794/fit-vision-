"use client";

import React, { useState } from "react";
import { Check, Palette, Sparkles } from "lucide-react";

export interface ColorOption {
  name: string;
  hex: string;
}

export interface SkinToneData {
  id: string;
  label: string;
  skinHex: string;
  recommendedColors: ColorOption[];
}

export const SKIN_TONES: SkinToneData[] = [
  {
    id: "dark",
    label: "DARK",
    skinHex: "#4A2C1D",
    recommendedColors: [
      { name: "Emerald Green", hex: "#097969" },
      { name: "Royal Blue", hex: "#4169E1" },
      { name: "Burgundy", hex: "#800020" },
      { name: "Deep Purple", hex: "#301934" },
      { name: "Teal", hex: "#008080" },
      { name: "Mustard", hex: "#FFDB58" },
      { name: "Chocolate Brown", hex: "#3F1C06" },
      { name: "Navy", hex: "#000080" },
    ],
  },
  {
    id: "brown",
    label: "BROWN",
    skinHex: "#8D5524",
    recommendedColors: [
      { name: "Olive Green", hex: "#708238" },
      { name: "Terracotta", hex: "#E2725B" },
      { name: "Camel", hex: "#C19A6B" },
      { name: "Cream", hex: "#FFFDD0" },
      { name: "Dusty Blue", hex: "#8A9EA7" },
      { name: "Chocolate Brown", hex: "#3F1C06" },
      { name: "Mocha", hex: "#967969" },
      { name: "Navy", hex: "#000080" },
    ],
  },
  {
    id: "medium",
    label: "MEDIUM",
    skinHex: "#C68642",
    recommendedColors: [
      { name: "Sage Green", hex: "#9CAF88" },
      { name: "Rust", hex: "#B7410E" },
      { name: "Warm Taupe", hex: "#B38B6D" },
      { name: "Blush", hex: "#DE5D83" },
      { name: "Steel Blue", hex: "#4682B4" },
      { name: "Mocha", hex: "#967969" },
      { name: "Pearl Gray", hex: "#E5E5E5" },
      { name: "Navy", hex: "#000080" },
    ],
  },
  {
    id: "light-medium",
    label: "LIGHT MEDIUM",
    skinHex: "#E0AC69",
    recommendedColors: [
      { name: "Dusty Blue", hex: "#8A9EA7" },
      { name: "Lavender", hex: "#E6E6FA" },
      { name: "Soft Pink", hex: "#FFB6C1" },
      { name: "Beige", hex: "#F5F5DC" },
      { name: "Teal", hex: "#008080" },
      { name: "Camel", hex: "#C19A6B" },
      { name: "Pearl Gray", hex: "#E5E5E5" },
      { name: "Navy", hex: "#000080" },
    ],
  },
  {
    id: "light",
    label: "LIGHT",
    skinHex: "#F1C27D",
    recommendedColors: [
      { name: "Sage Green", hex: "#9CAF88" },
      { name: "Lavender", hex: "#E6E6FA" },
      { name: "Soft Pink", hex: "#FFB6C1" },
      { name: "Cream", hex: "#FFFDD0" },
      { name: "Dusty Blue", hex: "#8A9EA7" },
      { name: "Beige", hex: "#F5F5DC" },
      { name: "Pearl Gray", hex: "#E5E5E5" },
      { name: "Navy", hex: "#000080" },
    ],
  },
];

// Realistic Upright Hand Vector Illustration matching reference photo
const UprightHandSVG = ({ skinHex, className }: { skinHex: string; className?: string }) => (
  <svg
    viewBox="0 0 100 180"
    className={className || "w-12 h-24 object-contain"}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.2))">
      {/* Main Hand Silhouette & Forearm */}
      <path
        d="M38 175 L36 115 C36 102 34 90 32 78 C30 68 32 55 35 44 L38 22 C38 17 43 15 46 19 L47 42 C47 34 51 28 54 32 L55 55 L57 18 C58 13 63 13 64 18 L65 56 L67 24 C68 19 72 19 73 24 L74 60 L76 34 C77 29 82 30 82 36 L79 78 C77 95 75 112 73 175 Z"
        fill={skinHex}
      />
      {/* Thumb reaching out */}
      <path
        d="M33 85 C24 78 16 70 20 60 C24 52 32 58 37 68 Z"
        fill={skinHex}
      />
      {/* Palm Knuckle Lines & Realistic Detail Highlights */}
      <path
        d="M46 19 C46 27 45 42 45 52"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M57 18 C57 27 56 46 56 56"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M67 24 C67 32 66 50 66 60"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M76 34 C76 42 75 56 75 68"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Palm crease highlight */}
      <path
        d="M35 88 C45 94 62 92 74 82"
        stroke="rgba(0,0,0,0.14)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

interface SkinToneSelectorProps {
  activeSkinToneId?: string;
  activeColorHex?: string;
  onSelectTone?: (tone: SkinToneData) => void;
  onSelectColor?: (color: ColorOption) => void;
  showPosterMode?: boolean;
}

export default function SkinToneSelector({
  activeSkinToneId = "medium",
  activeColorHex,
  onSelectTone,
  onSelectColor,
  showPosterMode = false,
}: SkinToneSelectorProps) {
  const [selectedTone, setSelectedTone] = useState<SkinToneData>(
    SKIN_TONES.find((t) => t.id === activeSkinToneId) || SKIN_TONES[2]
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    activeColorHex || selectedTone.recommendedColors[0].hex
  );

  const handleToneClick = (tone: SkinToneData) => {
    setSelectedTone(tone);
    const firstColor = tone.recommendedColors[0];
    setSelectedColor(firstColor.hex);

    if (onSelectTone) onSelectTone(tone);
    if (onSelectColor) onSelectColor(firstColor);
  };

  const handleColorClick = (color: ColorOption) => {
    setSelectedColor(color.hex);
    if (onSelectColor) onSelectColor(color);
  };

  return (
    <div className="w-full bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Palette className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
              What Colors To Wear For Your Skin Tone
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Select your hand skin shade to unlock personalized real-time clothing color recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedTone.skinHex }} />
          <span className="text-xs font-extrabold text-slate-800 tracking-wide">
            {selectedTone.label} SKIN MATCH
          </span>
        </div>
      </div>

      {/* 5 Hand Skin Tone Columns matching reference layout */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        {SKIN_TONES.map((tone) => {
          const isSelected = selectedTone.id === tone.id;
          return (
            <div
              key={tone.id}
              onClick={() => handleToneClick(tone)}
              className={`group cursor-pointer flex flex-col items-center p-3 sm:p-4 rounded-2xl border transition-all duration-300 ${
                isSelected
                  ? "border-blue-600 bg-blue-50/40 shadow-lg ring-2 ring-blue-500/20 scale-[1.02]"
                  : "border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-md"
              }`}
            >
              {/* Hand Graphics Container */}
              <div className="relative w-full h-32 flex items-center justify-center bg-gradient-to-b from-slate-100/60 to-transparent rounded-xl overflow-hidden mb-2">
                <UprightHandSVG
                  skinHex={tone.skinHex}
                  className="h-28 w-auto transition-transform duration-300 group-hover:scale-110"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Tone Title */}
              <span className="text-xs font-black text-slate-900 tracking-wider uppercase mb-3">
                {tone.label}
              </span>

              {/* Stacked Recommended Color Swatches */}
              <div className="w-full space-y-1.5">
                {tone.recommendedColors.map((color) => {
                  const isColorActive =
                    isSelected && selectedColor.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={color.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToneClick(tone);
                        handleColorClick(color);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                        isColorActive
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm scale-[1.03]"
                          : "border-transparent text-slate-800 hover:bg-white hover:border-slate-200"
                      }`}
                      style={{
                        backgroundColor: isColorActive ? undefined : color.hex,
                        color: isColorActive
                          ? "#FFFFFF"
                          : getContrastingTextColor(color.hex),
                      }}
                    >
                      <span className="truncate pr-1">{color.name}</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Color Indicator Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl border-2 border-white/20 shadow-inner shrink-0"
            style={{ backgroundColor: selectedColor }}
          />
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Recommended Active Palette Swatch</span>
            </div>
            <p className="text-sm font-bold text-white tracking-wide">
              {selectedTone.recommendedColors.find(
                (c) => c.hex.toLowerCase() === selectedColor.toLowerCase()
              )?.name || "Selected Shade"}{" "}
              <span className="text-slate-400 font-normal">({selectedColor})</span>
            </p>
          </div>
        </div>

        <span className="text-xs font-medium text-slate-300 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
          Best match for {selectedTone.label} skin tones
        </span>
      </div>
    </div>
  );
}

// Helper to pick readable text color over swatch background
function getContrastingTextColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#0F172A" : "#FFFFFF";
}
