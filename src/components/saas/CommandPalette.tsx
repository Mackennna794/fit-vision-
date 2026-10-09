"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command, Search, Zap, Store, BookOpen, Mail, ChevronRight } from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
  kbd?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenPricing: () => void;
}

export default function CommandPalette({ open, onClose, onOpenPricing }: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  const commands: CommandItem[] = [
    {
      id: "pricing",
      label: "Activate API Key",
      description: "Instant enterprise access — no credit card required",
      icon: <Zap className="w-4 h-4" />,
      action: () => { onClose(); onOpenPricing(); },
      category: "Actions",
      kbd: "↵",
    },
    {
      id: "store",
      label: "Open AuraMart Demo",
      description: "Live AR try-on storefront powered by FitVision",
      icon: <Store className="w-4 h-4" />,
      action: () => { onClose(); window.location.href = "/store"; },
      category: "Navigate",
      kbd: "G S",
    },
    {
      id: "docs",
      label: "Integration Docs",
      description: "Two-line embed snippet for any storefront",
      icon: <BookOpen className="w-4 h-4" />,
      action: () => { onClose(); document.getElementById("integration")?.scrollIntoView({ behavior: "smooth" }); },
      category: "Navigate",
    },
    {
      id: "pricing-section",
      label: "View Pricing",
      description: "Starter · Growth · Enterprise tiers",
      icon: <ChevronRight className="w-4 h-4" />,
      action: () => { onClose(); document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" }); },
      category: "Navigate",
    },
    {
      id: "contact",
      label: "Contact Sales",
      description: "Talk to the FitVision team",
      icon: <Mail className="w-4 h-4" />,
      action: () => { onClose(); window.open("mailto:hello@fitvision.ai"); },
      category: "Actions",
    },
  ];

  const filtered = query.trim()
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      setQuery("");
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="cmd-backdrop fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Palette Panel */}
          <motion.div
            key="panel"
            className="fixed inset-x-4 top-[15vh] z-50 mx-auto max-w-xl overflow-hidden rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.98)",
              backdropFilter: "blur(24px)",
              border: "1px solid #E2E8F0",
              boxShadow: "0 24px 80px rgba(15,23,42,0.18), 0 8px 24px rgba(15,23,42,0.10)",
            }}
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-fv-border">
              <Search className="w-4.5 h-4.5 text-fv-muted flex-shrink-0" style={{ width: 18, height: 18 }} />
              <input
                id="cmd-palette-input"
                type="text"
                placeholder="Search commands…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-[15px] text-fv-obsidian placeholder:text-fv-chrome outline-none font-medium"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              <kbd
                className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-fv-muted"
                style={{ background: "#F1F5F9", border: "1px solid #E2E8F0" }}
              >
                ESC
              </kbd>
            </div>

            {/* Command list */}
            <div className="max-h-[340px] overflow-y-auto py-2">
              {Object.keys(grouped).length === 0 ? (
                <div className="py-12 text-center text-sm text-fv-muted">
                  No commands found for &ldquo;{query}&rdquo;
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-4 py-2 text-[11px] font-semibold text-fv-muted uppercase tracking-wider">
                      {category}
                    </div>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        id={`cmd-${item.id}`}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-fv-alabaster group"
                        onClick={item.action}
                      >
                        <span
                          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{
                            background: "rgba(37,99,235,0.08)",
                            color: "#2563EB",
                          }}
                        >
                          {item.icon}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[14px] font-semibold text-fv-obsidian">
                            {item.label}
                          </span>
                          <span className="block text-[12px] text-fv-muted truncate">
                            {item.description}
                          </span>
                        </span>
                        {item.kbd && (
                          <kbd
                            className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-fv-muted flex-shrink-0"
                            style={{ background: "#F1F5F9", border: "1px solid #E2E8F0" }}
                          >
                            {item.kbd}
                          </kbd>
                        )}
                        <ChevronRight
                          className="w-3.5 h-3.5 text-fv-chrome opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        />
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-2.5 border-t border-fv-border"
              style={{ background: "#F8F9FA" }}
            >
              <span className="text-[11px] text-fv-muted">
                {filtered.length} command{filtered.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-3 text-[11px] text-fv-muted">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "#E2E8F0" }}>↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "#E2E8F0" }}>↵</kbd>
                  select
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
