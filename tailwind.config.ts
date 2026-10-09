import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // disabled — light mode only per spec
  theme: {
    extend: {
      colors: {
        // FitVision Brand Palette
        fv: {
          alabaster: "#F8F9FA",
          white: "#FFFFFF",
          border: "#E2E8F0",
          obsidian: "#0F172A",
          slate: "#334155",
          muted: "#64748B",
          cobalt: "#2563EB",
          "cobalt-light": "#3B82F6",
          "cobalt-dark": "#1D4ED8",
          "cobalt-glow": "rgba(37,99,235,0.12)",
          chrome: "#CBD5E1",
          "chrome-light": "#F1F5F9",
          success: "#10B981",
          amber: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "fv-gradient": "linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 50%, #EEF2FF 100%)",
        "cobalt-gradient": "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
        "chrome-gradient": "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 50%, #CBD5E1 100%)",
        "mesh-gradient": "radial-gradient(at 40% 20%, #EEF2FF 0px, transparent 50%), radial-gradient(at 80% 0%, #DBEAFE 0px, transparent 50%), radial-gradient(at 0% 50%, #F8F9FA 0px, transparent 50%)",
      },
      boxShadow: {
        "fv-sm": "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
        "fv-md": "0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)",
        "fv-lg": "0 8px 32px rgba(15,23,42,0.10), 0 4px 8px rgba(15,23,42,0.06)",
        "fv-xl": "0 20px 60px rgba(15,23,42,0.12), 0 8px 20px rgba(15,23,42,0.08)",
        "cobalt-glow": "0 0 0 3px rgba(37,99,235,0.15), 0 4px 20px rgba(37,99,235,0.20)",
        "chrome-inset": "inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(15,23,42,0.06)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "scale-in": "scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-down": "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "shimmer": "shimmer 2.5s linear infinite",
        "pulse-cobalt": "pulseCobalt 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "draw": "draw 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        pulseCobalt: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(37,99,235,0.3)" },
          "50%": { boxShadow: "0 0 0 8px rgba(37,99,235,0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        draw: {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.16, 1, 0.3, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
};
export default config;
