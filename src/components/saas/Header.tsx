"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Command, Store, LayoutDashboard, Zap } from "lucide-react";
import CommandPalette from "./CommandPalette";
import Link from "next/link";

interface HeaderProps {
  onOpenPricing?: () => void;
}

export default function Header({ onOpenPricing }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Scroll detection for glass transition
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Cmd+K / Ctrl+K global shortcut
  const handleGlobalKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setPaletteOpen((v) => !v);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKey);
    return () => document.removeEventListener("keydown", handleGlobalKey);
  }, [handleGlobalKey]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 lg:px-10"
        style={{
          height: "var(--header-height, 64px)",
          background: scrolled
            ? "rgba(255,255,255,0.95)"
            : "rgba(248,249,250,0.80)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: scrolled ? "1px solid #E2E8F0" : "1px solid transparent",
          boxShadow: scrolled ? "0 1px 20px rgba(15,23,42,0.06)" : "none",
          transition: "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
        }}
        role="banner"
      >
        {/* Logo mark */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="FitVision home">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              boxShadow: "0 2px 8px rgba(37,99,235,0.35)",
            }}
          >
            FV
          </div>
          <span
            className="text-[17px] font-bold tracking-[-0.03em] text-slate-900"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            FitVision
          </span>
        </Link>

        {/* Center nav with required links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          <Link
            href="/store"
            className="px-3.5 py-2 rounded-lg text-[14px] font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-150 flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5 text-blue-600" />
            <span>AuraMart Store</span>
          </Link>

          <Link
            href="/dashboard"
            className="px-3.5 py-2 rounded-lg text-[14px] font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-150 flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
            <span>Seller Dashboard</span>
          </Link>

          <a
            href="#pricing"
            className="px-3.5 py-2 rounded-lg text-[14px] font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-150 flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Enterprise B2B</span>
          </a>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Cmd+K trigger */}
          <button
            id="header-cmd-palette-btn"
            onClick={() => setPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 transition-colors duration-150"
            aria-label="Open command palette (⌘K)"
            title="Command palette"
          >
            <Command className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Search</span>
            <span
              className="hidden lg:flex items-center gap-0.5 text-[11px] font-semibold rounded px-1 py-0.5"
              style={{ background: "#F1F5F9", color: "#94A3B8" }}
            >
              <span>⌘</span>
              <span>K</span>
            </span>
          </button>

          {/* CTA */}
          <motion.button
            id="header-get-api-key-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (onOpenPricing) onOpenPricing();
              else {
                const el = document.getElementById("pricing");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              boxShadow: "0 2px 8px rgba(37,99,235,0.35)",
            }}
          >
            <Zap className="w-3.5 h-3.5" />
            Get API Key
          </motion.button>
        </div>
      </motion.header>

      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenPricing={onOpenPricing || (() => {})}
      />
    </>
  );
}
