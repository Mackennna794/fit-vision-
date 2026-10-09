"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Check, Copy, CheckCheck, Shield, TrendingUp, Sparkles } from "lucide-react";

interface PricingTier {
  id: "starter" | "growth" | "enterprise";
  name: string;
  price: string;
  period: string;
  description: string;
  requests: string;
  features: string[];
  accent: string;
  recommended?: boolean;
  apiKey: string;
}

const TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$0",
    period: "/ month",
    description: "Perfect for indie devs and small stores validating AR try-on.",
    requests: "1,000 requests/mo",
    features: [
      "1,000 API calls/month",
      "WebAssembly runtime",
      "2 garment categories",
      "Community support",
      "Public analytics",
    ],
    accent: "#64748B",
    apiKey: "fv_starter_pk_demo",
  },
  {
    id: "growth",
    name: "Growth",
    price: "$49",
    period: "/ month",
    description: "For scaling DTC brands that need headroom and priority support.",
    requests: "25,000 requests/mo",
    features: [
      "25,000 API calls/month",
      "WebGPU acceleration",
      "All garment categories",
      "Priority email support",
      "Advanced analytics",
      "Custom branding overlay",
    ],
    accent: "#2563EB",
    recommended: true,
    apiKey: "fv_growth_pk_demo",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "White-glove onboarding, SLA, dedicated infrastructure.",
    requests: "Unlimited requests",
    features: [
      "Unlimited API calls",
      "Dedicated edge workers",
      "SLA 99.99% uptime",
      "White-label SDK",
      "Slack support",
      "Custom model fine-tuning",
      "On-prem deployment",
    ],
    accent: "#7C3AED",
    apiKey: "fv_live_demo_hackathon_2026",
  },
];

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PricingModal({ open, onClose }: PricingModalProps) {
  const [selected, setSelected] = useState<"starter" | "growth" | "enterprise">("growth");
  const [activated, setActivated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const tier = TIERS.find((t) => t.id === selected)!;

  const handleActivate = async () => {
    setLoading(true);
    // Simulate async key activation
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setActivated(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tier.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setActivated(false);
      setSelected("growth");
    }, 400);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="pricing-backdrop"
            className="fixed inset-0 z-50 cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            key="pricing-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pricing-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl pointer-events-auto"
              style={{
                background: "white",
                border: "1px solid #E2E8F0",
                boxShadow: "0 32px 100px rgba(15,23,42,0.20), 0 12px 32px rgba(15,23,42,0.12)",
              }}
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Header */}
              <div
                className="relative flex items-start justify-between p-6 pb-5 border-b border-fv-border"
                style={{ background: "linear-gradient(135deg, #F8F9FA 0%, #EEF2FF 100%)" }}
              >
                <div>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-bold mb-3"
                    style={{
                      background: "rgba(37,99,235,0.10)",
                      color: "#2563EB",
                      border: "1px solid rgba(37,99,235,0.20)",
                    }}
                  >
                    <Zap className="w-3 h-3" />
                    Instant Activation — No Credit Card
                  </div>
                  <h2
                    id="pricing-modal-title"
                    className="text-2xl font-black text-fv-obsidian tracking-[-0.02em]"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {activated ? "🎉 Your API Key is Live" : "Get Your FitVision API Key"}
                  </h2>
                  <p className="text-[14px] text-fv-muted mt-1">
                    {activated
                      ? "Copy your key and paste it into the two-line embed snippet."
                      : "Choose a tier and activate instantly. Upgrade anytime."}
                  </p>
                </div>
                <button
                  id="pricing-modal-close-btn"
                  onClick={handleClose}
                  className="ml-4 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-fv-muted hover:bg-fv-border hover:text-fv-obsidian transition-colors"
                  aria-label="Close pricing modal"
                >
                  <X className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                </button>
              </div>

              {!activated ? (
                /* ── Tier selection ───────────────────────────────────────── */
                <div className="p-6">
                  {/* Tier tabs */}
                  <div
                    className="flex gap-2 p-1.5 rounded-2xl mb-6"
                    style={{ background: "#F1F5F9" }}
                    role="tablist"
                    aria-label="Pricing tiers"
                  >
                    {TIERS.map((t) => (
                      <button
                        key={t.id}
                        id={`pricing-tier-${t.id}-tab`}
                        role="tab"
                        aria-selected={selected === t.id}
                        onClick={() => setSelected(t.id)}
                        className="relative flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200"
                        style={{
                          background: selected === t.id ? "white" : "transparent",
                          color: selected === t.id ? t.accent : "#64748B",
                          boxShadow:
                            selected === t.id
                              ? "0 1px 6px rgba(15,23,42,0.08)"
                              : "none",
                        }}
                      >
                        {t.recommended && (
                          <span
                            className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white"
                            style={{ background: "#2563EB" }}
                          >
                            Popular
                          </span>
                        )}
                        {t.name}
                      </button>
                    ))}
                  </div>

                  {/* Selected tier detail */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selected}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {/* Price row */}
                      <div className="flex items-end gap-2 mb-2">
                        <span
                          className="text-4xl font-black tracking-[-0.03em]"
                          style={{ color: tier.accent, fontFamily: "var(--font-inter)" }}
                        >
                          {tier.price}
                        </span>
                        {tier.period && (
                          <span className="text-fv-muted text-[15px] mb-1.5 font-medium">
                            {tier.period}
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] text-fv-slate mb-5">{tier.description}</p>

                      {/* Requests badge */}
                      <div
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold mb-6"
                        style={{
                          background: `${tier.accent}10`,
                          border: `1px solid ${tier.accent}25`,
                          color: tier.accent,
                          fontFamily: "var(--font-geist-mono)",
                        }}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        {tier.requests}
                      </div>

                      {/* Features */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                        {tier.features.map((feat) => (
                          <div key={feat} className="flex items-center gap-2.5">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: `${tier.accent}15`, color: tier.accent }}
                            >
                              <Check className="w-3 h-3" />
                            </div>
                            <span className="text-[13px] text-fv-slate font-medium">
                              {feat}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Activate button */}
                  <motion.button
                    id="pricing-activate-btn"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleActivate}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[15px] font-bold text-white"
                    style={{
                      background: loading
                        ? "#94A3B8"
                        : `linear-gradient(135deg, ${tier.accent} 0%, ${tier.accent}CC 100%)`,
                      boxShadow: loading ? "none" : `0 6px 24px ${tier.accent}40`,
                      transition: "background 0.3s ease, box-shadow 0.3s ease",
                    }}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                        />
                        Generating Key…
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Activate {tier.name} — Instant Access
                      </>
                    )}
                  </motion.button>

                  {/* Trust row */}
                  <div className="flex items-center justify-center gap-6 mt-5">
                    {[
                      { icon: <Shield className="w-3.5 h-3.5" />, label: "No credit card" },
                      { icon: <Sparkles className="w-3.5 h-3.5" />, label: "Instant activation" },
                      { icon: <Check className="w-3.5 h-3.5" />, label: "Cancel anytime" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-1.5 text-[12px] text-fv-muted font-medium"
                      >
                        <span className="text-fv-cobalt">{item.icon}</span>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* ── Activation success ───────────────────────────────────── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="p-6"
                >
                  {/* Success animation */}
                  <div className="flex flex-col items-center text-center mb-8">
                    <motion.div
                      className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                      style={{
                        background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                        boxShadow: "0 8px 32px rgba(16,185,129,0.35)",
                      }}
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <CheckCheck className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3
                      className="text-xl font-black text-fv-obsidian mb-2"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {tier.name} Plan Activated
                    </h3>
                    <p className="text-[14px] text-fv-muted max-w-sm">
                      Your API key is ready. Embed FitVision in your storefront with two lines of code.
                    </p>
                  </div>

                  {/* API key display */}
                  <div
                    className="flex items-center gap-3 p-4 rounded-2xl mb-6"
                    style={{
                      background: "#F8F9FA",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <code
                      className="flex-1 text-[13px] font-bold truncate"
                      style={{
                        color: tier.accent,
                        fontFamily: "var(--font-geist-mono)",
                      }}
                    >
                      {tier.apiKey}
                    </code>
                    <button
                      id="pricing-copy-key-btn"
                      onClick={handleCopy}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
                      style={{
                        background: copied ? "#10B981" : tier.accent,
                        color: "white",
                        boxShadow: `0 2px 8px ${copied ? "rgba(16,185,129,0.35)" : `${tier.accent}35`}`,
                      }}
                      aria-label="Copy API key"
                    >
                      {copied ? (
                        <><CheckCheck className="w-3.5 h-3.5" /> Copied!</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy</>
                      )}
                    </button>
                  </div>

                  {/* Embed snippet */}
                  <div
                    className="rounded-2xl overflow-hidden mb-6"
                    style={{ border: "1px solid #E2E8F0" }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-2.5"
                      style={{ background: "#0F172A" }}
                    >
                      <span className="text-[12px] font-semibold text-slate-400">
                        Embed Snippet — paste into your &lt;head&gt;
                      </span>
                      <div className="flex gap-1.5">
                        {["#EF4444", "#EAB308", "#22C55E"].map((c) => (
                          <div
                            key={c}
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <pre
                      className="p-4 text-[12px] leading-relaxed overflow-x-auto"
                      style={{
                        background: "#1E293B",
                        color: "#94A3B8",
                        fontFamily: "var(--font-geist-mono)",
                      }}
                    >
                      <code>
                        <span style={{ color: "#64748B" }}>{`<!-- FitVision AR Try-On -->`}</span>
                        {`\n`}
                        <span style={{ color: "#38BDF8" }}>{`<script`}</span>
                        <span style={{ color: "#7DD3FC" }}>{` src`}</span>
                        <span style={{ color: "#94A3B8" }}>{`=`}</span>
                        <span style={{ color: "#86EFAC" }}>{`"https://cdn.fitvision.ai/v2/widget.js"`}</span>
                        {`\n`}
                        <span style={{ color: "#7DD3FC" }}>{"        data-key"}</span>
                        <span style={{ color: "#94A3B8" }}>{`=`}</span>
                        <span style={{ color: "#FCA5A5" }}>{`"${tier.apiKey}"`}</span>
                        <span style={{ color: "#38BDF8" }}>{`></script>`}</span>
                      </code>
                    </pre>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="/store"
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-bold text-white"
                      style={{
                        background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                        boxShadow: "0 4px 20px rgba(37,99,235,0.35)",
                      }}
                      id="pricing-open-auramart-btn"
                    >
                      <Zap className="w-4 h-4" />
                      Launch AuraMart Demo
                    </a>
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3.5 rounded-2xl text-[14px] font-semibold text-fv-slate border border-fv-border hover:bg-fv-alabaster transition-colors"
                      id="pricing-close-success-btn"
                    >
                      Back to FitVision
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
