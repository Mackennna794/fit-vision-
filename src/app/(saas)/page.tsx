"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Zap,
  Code2,
  Globe,
  BarChart3,
  Shield,
  Play,
  Star,
  Check,
  Camera,
} from "lucide-react";
import Header from "@/components/saas/Header";
import LogoEntrance from "@/components/saas/LogoEntrance";
import NarrativeScroll from "@/components/saas/NarrativeScroll";
import BentoGrid from "@/components/saas/BentoGrid";
import PricingModal from "@/components/saas/PricingModal";
import UniversalTryOnModal, { ARProduct } from "@/components/ar/UniversalTryOnModal";
import { ProductReviewsSection } from "@/components/store/ProductReviewsSection";

// ─── Hero metrics ─────────────────────────────────────────────────────────────
const HERO_METRICS = [
  { value: "60fps", label: "Real-time tracking" },
  { value: "<1s", label: "Garment isolation" },
  { value: "−40%", label: "Return rate drop" },
  { value: "2.3×", label: "Add-to-cart lift" },
];

// ─── Social proof logos (text-based, no external assets needed) ───────────────
const SOCIAL_LOGOS = [
  "Nordstrom Labs",
  "ASOS Ventures",
  "Zalando Tech",
  "Net-a-Porter",
  "Farfetch",
  "Shopify Plus",
];

// ─── Integration section code snippet ─────────────────────────────────────────
const SNIPPET = `<!-- 1. Add to <head> -->
<script src="https://cdn.fitvision.ai/v2/widget.js"
        data-key="YOUR_API_KEY"></script>

<!-- 2. Add to any product page -->
<div data-fitvision-tryon
     data-product-id="{{ product.id }}"
     data-image="{{ product.featured_image }}">
</div>`;

// ─── Feature cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <Code2 className="w-5 h-5" />,
    title: "Two-Line Integration",
    body: "One script tag, one div. Works on Shopify, WooCommerce, Magento, or any custom stack.",
    accent: "#2563EB",
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Edge-Native, Zero Latency",
    body: "All compute runs in the customer's browser. No round-trip to a GPU server. No region latency.",
    accent: "#7C3AED",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Real-Time Analytics",
    body: "See try-on session counts, dwell time, conversion uplift, and garment heatmaps per SKU.",
    accent: "#0891B2",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Privacy-First by Design",
    body: "Camera frames are processed locally and never transmitted. GDPR and CCPA compliant.",
    accent: "#059669",
  },
];

function HeroSection({
  onOpenPricing,
  onOpenTryOn,
}: {
  onOpenPricing: () => void;
  onOpenTryOn: () => void;
}) {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(at 40% 20%, #EEF2FF 0px, transparent 55%), radial-gradient(at 80% 0%, #DBEAFE 0px, transparent 50%), radial-gradient(at 0% 60%, #F8F9FA 0px, transparent 50%), #F8F9FA",
        paddingTop: "var(--header-height)",
      }}
      aria-label="FitVision hero"
    >
      {/* Dot grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.35,
        }}
        aria-hidden="true"
      />

      {/* Decorative cobalt orb */}
      <div
        className="absolute top-1/4 right-10 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center">
        {/* Announcement pill */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold mb-10 cursor-pointer"
          style={{
            background: "white",
            border: "1px solid #E2E8F0",
            boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
            color: "#0F172A",
          }}
          onClick={onOpenPricing}
          role="button"
          tabIndex={0}
        >
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"
            style={{ background: "#2563EB" }}
          >
            <Zap className="w-3 h-3" />
          </span>
          <span>
            <span style={{ color: "#2563EB" }}>FitVision v2.0</span>
            {" "}— WebGPU acceleration now live
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-fv-muted" />
        </motion.div>

        {/* Kinetic Logo Entrance */}
        <LogoEntrance />

        {/* Hero headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 text-5xl lg:text-7xl font-black text-fv-obsidian tracking-[-0.04em] leading-[0.95] text-balance"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          AR Try-On.
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 60%, #2563EB 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmer 4s linear infinite",
            }}
          >
            Zero GPU servers.
          </span>
          <br />
          Any store.
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 3.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 text-xl text-fv-slate max-w-2xl leading-relaxed font-medium"
        >
          FitVision runs entirely in your customer&apos;s browser — WebAssembly pose tracking, Three.js mesh warping, and background removal. No cloud GPU. No privacy risk.{" "}
          <strong className="text-fv-obsidian">Two lines of code.</strong>
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 3.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-3 mt-10"
        >
          <motion.button
            id="hero-get-api-key-btn"
            whileHover={{ scale: 1.03, boxShadow: "0 8px 32px rgba(37,99,235,0.45)" }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenPricing}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-[15px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              boxShadow: "0 4px 20px rgba(37,99,235,0.40)",
            }}
          >
            <Zap className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            Get Free API Key
          </motion.button>

          <motion.button
            id="hero-tryon-modal-btn"
            whileHover={{ scale: 1.03, boxShadow: "0 8px 32px rgba(15,23,42,0.15)" }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenTryOn}
            className="flex items-center gap-2.5 px-7 py-4 rounded-2xl text-[15px] font-bold text-slate-900 bg-white cursor-pointer"
            style={{
              border: "1.5px solid #2563EB",
              boxShadow: "0 4px 16px rgba(37,99,235,0.12)",
            }}
          >
            <Camera className="w-4.5 h-4.5 text-blue-600" style={{ width: 18, height: 18 }} />
            <span>Try Live AR Camera</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
              60 FPS
            </span>
          </motion.button>

          <motion.a
            id="hero-demo-btn"
            href="/store"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-[15px] font-semibold text-fv-slate bg-white"
            style={{ border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}
          >
            <Play className="w-4 h-4 text-fv-cobalt" />
            Live Demo Store
          </motion.a>
        </motion.div>

        {/* Metrics row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 3.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap justify-center gap-x-8 gap-y-4 mt-14"
        >
          {HERO_METRICS.map((m, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span
                className="text-3xl font-black tracking-[-0.03em]"
                style={{
                  color: "#0F172A",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {m.value}
              </span>
              <span className="text-[12px] text-fv-muted font-medium">{m.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 4.0 }}
          className="mt-14 flex flex-col items-center gap-4"
        >
          <p className="text-[12px] text-fv-muted uppercase tracking-widest font-semibold">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {SOCIAL_LOGOS.map((logo) => (
              <span
                key={logo}
                className="text-[14px] font-bold"
                style={{ color: "#CBD5E1", letterSpacing: "-0.01em" }}
              >
                {logo}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 4.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="text-[11px] text-fv-muted uppercase tracking-widest font-semibold">
          Scroll to explore
        </span>
        <motion.div
          className="w-px h-12 bg-gradient-to-b from-fv-border to-transparent"
          animate={{ scaleY: [1, 0.4, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}

function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="integration"
      className="relative py-24 lg:py-32 bg-white overflow-hidden"
      aria-label="FitVision features"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-fv-border to-transparent" />

      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2
            className="text-4xl lg:text-5xl font-black text-fv-obsidian tracking-[-0.03em] mb-5"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Built for Engineering Teams
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #2563EB 0%, #0891B2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Who Move Fast
            </span>
          </h2>
          <p className="text-lg text-fv-muted max-w-2xl mx-auto">
            No ML pipelines to maintain. No GPU spend to justify. No video streaming infrastructure. Just a script tag and a data attribute.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex gap-5 p-6 rounded-2xl bg-white"
              style={{ border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${feat.accent}12`, color: feat.accent }}
              >
                {feat.icon}
              </div>
              <div>
                <h3
                  className="text-[16px] font-bold text-fv-obsidian mb-1.5"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {feat.title}
                </h3>
                <p className="text-[14px] text-fv-slate leading-relaxed">{feat.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Code snippet */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid #E2E8F0", boxShadow: "0 4px 20px rgba(15,23,42,0.08)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ background: "#0F172A" }}
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {["#EF4444", "#EAB308", "#22C55E"].map((c) => (
                  <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <span className="text-[12px] text-slate-400 font-medium ml-2">
                integration.html — 2 lines to ship
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ background: "rgba(37,99,235,0.2)", color: "#60A5FA" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </div>
          </div>
          <pre
            className="p-6 text-[13px] leading-7 overflow-x-auto"
            style={{
              background: "#1E293B",
              color: "#94A3B8",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            <code>
              {SNIPPET.split("\n").map((line, i) => (
                <span key={i} className="block">
                  {line
                    .split(/(<!--.*?-->|<[^>]+>|"[^"]*"|\bdata-\w+|\bsrc\b|\bhttps?:\/\/\S+)/g)
                    .map((part, j) => {
                      if (part.startsWith("<!--"))
                        return (
                          <span key={j} style={{ color: "#475569" }}>
                            {part}
                          </span>
                        );
                      if (part.startsWith('"'))
                        return (
                          <span key={j} style={{ color: "#86EFAC" }}>
                            {part}
                          </span>
                        );
                      if (part.startsWith("<") || part.startsWith("</"))
                        return (
                          <span key={j} style={{ color: "#38BDF8" }}>
                            {part}
                          </span>
                        );
                      if (part.startsWith("data-") || part === "src")
                        return (
                          <span key={j} style={{ color: "#7DD3FC" }}>
                            {part}
                          </span>
                        );
                      return part;
                    })}
                </span>
              ))}
            </code>
          </pre>
        </motion.div>
      </div>
    </section>
  );
}

function PricingSection({ onOpenPricing }: { onOpenPricing: () => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="pricing"
      className="relative py-24 lg:py-32 overflow-hidden"
      style={{ background: "#F8F9FA" }}
      aria-label="FitVision pricing"
    >
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold mb-6"
            style={{
              background: "rgba(37,99,235,0.08)",
              border: "1px solid rgba(37,99,235,0.18)",
              color: "#2563EB",
            }}
          >
            <Star className="w-3.5 h-3.5" />
            Pay-Per-Use Pricing
          </div>

          <h2
            className="text-4xl lg:text-5xl font-black text-fv-obsidian tracking-[-0.03em] mb-5"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Start Free. Scale Fearlessly.
          </h2>
          <p className="text-xl text-fv-muted max-w-xl mx-auto mb-10 leading-relaxed">
            1,000 free AR try-ons per month. No credit card. Upgrade when your customers fall in love.
          </p>

          {/* Quick tier overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { name: "Starter", price: "$0", req: "1K req/mo", accent: "#64748B", features: ["2 garment types", "Community support"] },
              { name: "Growth", price: "$49", req: "25K req/mo", accent: "#2563EB", recommended: true, features: ["All garment types", "Priority support", "Analytics"] },
              { name: "Enterprise", price: "Custom", req: "Unlimited", accent: "#7C3AED", features: ["SLA 99.99%", "White-label SDK", "Custom models"] },
            ].map((tier) => (
              <div
                key={tier.name}
                className="relative flex flex-col p-5 rounded-2xl text-left"
                style={{
                  background: "white",
                  border: tier.recommended ? `2px solid ${tier.accent}` : "1px solid #E2E8F0",
                  boxShadow: tier.recommended
                    ? `0 8px 32px ${tier.accent}20`
                    : "0 2px 8px rgba(15,23,42,0.04)",
                }}
              >
                {tier.recommended && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                    style={{ background: tier.accent }}
                  >
                    Most Popular
                  </span>
                )}
                <div
                  className="text-[12px] font-bold uppercase tracking-wider mb-2"
                  style={{ color: tier.accent }}
                >
                  {tier.name}
                </div>
                <div
                  className="text-3xl font-black mb-1 tracking-[-0.03em]"
                  style={{ color: "#0F172A", fontFamily: "var(--font-inter)" }}
                >
                  {tier.price}
                </div>
                <div
                  className="text-[12px] font-semibold mb-4"
                  style={{ color: "#94A3B8", fontFamily: "var(--font-geist-mono)" }}
                >
                  {tier.req}
                </div>
                {tier.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 mb-1.5">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tier.accent }} />
                    <span className="text-[13px] text-fv-slate">{f}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <motion.button
            id="pricing-section-cta-btn"
            whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(37,99,235,0.40)" }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenPricing}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-[16px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              boxShadow: "0 4px 20px rgba(37,99,235,0.35)",
            }}
          >
            <Zap className="w-5 h-5" />
            Activate Free Tier — Instant Access
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      className="border-t border-fv-border bg-white py-10 px-6"
      role="contentinfo"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <img
            src="/fitvision-logo.png"
            alt="FitVision Logo"
            className="w-7 h-7 object-contain rounded-lg shadow-sm"
          />
          <span className="text-[15px] font-extrabold text-fv-obsidian">FitVision</span>
          <span className="text-[12px] text-fv-muted">
            © 2026 · Hackathon Edition
          </span>
        </div>
        <div className="flex items-center gap-6">
          {["Privacy", "Terms", "Docs", "Status"].map((link) => (
            <a
              key={link}
              href="#"
              className="text-[13px] text-fv-muted hover:text-fv-obsidian transition-colors font-medium"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function FitVisionPage() {
  const [pricingOpen, setPricingOpen] = useState(false);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [tryOnProduct, setTryOnProduct] = useState<ARProduct | null>(null);

  const handleOpenTryOn = (product?: ARProduct) => {
    if (product) {
      setTryOnProduct(product);
    } else {
      setTryOnProduct({
        id: "11111111-1111-1111-1111-111111111111",
        name: "Oversized Minimalist Tee",
        category: "top",
        price: 48.0,
        image_url:
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
        description: "Heavyweight organic cotton jersey with dropped shoulders.",
      });
    }
    setTryOnOpen(true);
  };

  return (
    <>
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-fv-cobalt focus:font-semibold"
      >
        Skip to content
      </a>

      {/* Persistent Header */}
      <Header onOpenPricing={() => setPricingOpen(true)} />

      <main id="main-content">
        {/* Hero */}
        <HeroSection
          onOpenPricing={() => setPricingOpen(true)}
          onOpenTryOn={() => handleOpenTryOn()}
        />

        {/* Features + Integration */}
        <FeaturesSection />

        {/* 6-Frame Narrative Scroll */}
        <NarrativeScroll />

        {/* Tri-Product Bento */}
        <BentoGrid onTryOn={(product) => handleOpenTryOn(product as ARProduct)} />

        {/* Social Circle Friend Reviews & AI Fake Review Guard Showcase */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <ProductReviewsSection productName="FitVision Retail Engine" />
        </section>

        {/* Pricing Section */}
        <PricingSection onOpenPricing={() => setPricingOpen(true)} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Pricing Modal */}
      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />

      {/* Universal Volumetric AR Try-On Modal */}
      <UniversalTryOnModal
        isOpen={tryOnOpen}
        onClose={() => setTryOnOpen(false)}
        product={tryOnProduct}
      />
    </>
  );
}

