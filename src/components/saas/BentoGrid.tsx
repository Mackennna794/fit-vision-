"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shirt, Glasses, ArrowRight, Cpu, Zap, Check } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  category: "top" | "headwear";
  price: number;
  imageUrl: string;
  description: string;
  metrics: { label: string; value: string }[];
  accent: string;
  tags: string[];
}

interface BentoGridProps {
  onTryOn?: (product: {
    id: string;
    name: string;
    category: "top" | "bottom" | "headwear";
    price: number;
    image_url: string;
    description?: string;
  }) => void;
}

const PRODUCTS: Product[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Oversized Minimalist Tee",
    category: "top",
    price: 48,
    imageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    description:
      "Heavyweight organic cotton jersey with dropped shoulders. AR-tracked via shoulder-to-hip vector mesh.",
    metrics: [
      { label: "Mesh density", value: "16×16" },
      { label: "Track points", value: "12" },
    ],
    accent: "#2563EB",
    tags: ["Organic Cotton", "Unisex Fit", "AR Ready"],
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Monochrome Street Hoodie",
    category: "top",
    price: 95,
    imageUrl:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
    description:
      "Structured loopback French terry with relaxed fit. Full torso mesh with hood-depth simulation.",
    metrics: [
      { label: "Mesh density", value: "16×16" },
      { label: "Track points", value: "18" },
    ],
    accent: "#7C3AED",
    tags: ["French Terry", "Relaxed Fit", "Hood Sim"],
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Titanium Aviator Sunglasses",
    category: "headwear",
    price: 120,
    imageUrl:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80",
    description:
      "Ultralight titanium frame with polarized gradient lenses. Face-landmark mesh with real-time yaw correction.",
    metrics: [
      { label: "Face points", value: "468" },
      { label: "FPS", value: "60" },
    ],
    accent: "#0891B2",
    tags: ["Titanium", "Polarized", "FaceMesh"],
  },
];

function ProductCard({
  product,
  index,
  onTryOn,
}: {
  product: Product;
  index: number;
  onTryOn?: BentoGridProps["onTryOn"];
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.65,
        delay: index * 0.12,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white"
      style={{
        border: "1px solid #E2E8F0",
        boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 12px 40px rgba(15,23,42,0.12)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 2px 12px rgba(15,23,42,0.06)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
      aria-label={`${product.name} — AR Try-On`}
    >
      {/* Image area */}
      <div className="relative overflow-hidden aspect-[4/3] bg-fv-alabaster">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* AR overlay badge */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid #E2E8F0",
            boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
            color: product.accent,
          }}
        >
          <Cpu className="w-3 h-3" />
          AR Enabled
        </div>

        {/* Price badge */}
        <div
          className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-[13px] font-black"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid #E2E8F0",
            color: "#0F172A",
          }}
        >
          ${product.price}
        </div>

        {/* Category icon */}
        <div
          className="absolute bottom-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${product.accent}18`, color: product.accent }}
        >
          {product.category === "headwear" ? (
            <Glasses className="w-4 h-4" />
          ) : (
            <Shirt className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                background: `${product.accent}10`,
                color: product.accent,
                border: `1px solid ${product.accent}20`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <h3
          className="text-[17px] font-bold text-fv-obsidian mb-2 tracking-[-0.02em] leading-snug"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          {product.name}
        </h3>
        <p className="text-[13px] text-fv-slate leading-relaxed flex-1 mb-4">
          {product.description}
        </p>

        {/* Metrics row */}
        <div
          className="flex gap-3 mb-4 p-3 rounded-xl"
          style={{ background: "#F8F9FA", border: "1px solid #E2E8F0" }}
        >
          {product.metrics.map((m) => (
            <div key={m.label} className="flex-1 text-center">
              <div
                className="text-[16px] font-black"
                style={{ color: product.accent, fontFamily: "var(--font-geist-mono)" }}
              >
                {m.value}
              </div>
              <div className="text-[10px] text-fv-muted font-medium mt-0.5">
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Try-On CTA */}
        {onTryOn ? (
          <motion.button
            type="button"
            onClick={() =>
              onTryOn({
                id: product.id,
                name: product.name,
                category: product.category,
                price: product.price,
                image_url: product.imageUrl,
                description: product.description,
              })
            }
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${product.accent} 0%, ${product.accent}CC 100%)`,
              boxShadow: `0 3px 12px ${product.accent}35`,
            }}
            id={`bento-tryon-${product.id}`}
            aria-label={`Try on ${product.name}`}
          >
            <Zap className="w-3.5 h-3.5" />
            Launch Live AR Try-On
            <ArrowRight className="w-3.5 h-3.5 opacity-70" />
          </motion.button>
        ) : (
          <motion.a
            href="/store"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
            style={{
              background: `linear-gradient(135deg, ${product.accent} 0%, ${product.accent}CC 100%)`,
              boxShadow: `0 3px 12px ${product.accent}35`,
            }}
            id={`bento-tryon-${product.id}`}
            aria-label={`Try on ${product.name} in AuraMart`}
          >
            <Zap className="w-3.5 h-3.5" />
            Try On in AuraMart
            <ArrowRight className="w-3.5 h-3.5 opacity-70" />
          </motion.a>
        )}
      </div>
    </motion.article>
  );
}

export default function BentoGrid({ onTryOn }: BentoGridProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="platform"
      className="relative py-24 lg:py-36 overflow-hidden bg-white"
      aria-label="FitVision product demo catalog"
    >
      {/* Subtle top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-fv-border to-transparent" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold mb-6"
            style={{
              background: "rgba(37,99,235,0.08)",
              border: "1px solid rgba(37,99,235,0.18)",
              color: "#2563EB",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-fv-cobalt" />
            Live Demo Catalog
          </div>

          <h2
            className="text-4xl lg:text-5xl font-black text-fv-obsidian tracking-[-0.03em] mb-5"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Three Garments.
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Three AR Techniques.
            </span>
          </h2>
          <p className="text-lg text-fv-muted max-w-xl mx-auto leading-relaxed">
            Each item in AuraMart demonstrates a different tracking modality — torso mesh, full-body mesh, and facial landmark tracking.
          </p>

          {/* Feature checklist */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {[
              "WebAssembly-powered",
              "60 fps tracking",
              "No backend GPU",
              "Instant texture cache",
            ].map((feat) => (
              <div
                key={feat}
                className="flex items-center gap-2 text-[13px] font-medium text-fv-slate"
              >
                <Check className="w-4 h-4 text-fv-cobalt flex-shrink-0" />
                {feat}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onTryOn={onTryOn}
            />
          ))}
        </div>

        {/* Bottom CTA banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-5 rounded-2xl p-6 lg:p-8"
          style={{
            background: "linear-gradient(135deg, #EEF2FF 0%, #DBEAFE 100%)",
            border: "1px solid rgba(37,99,235,0.15)",
          }}
        >
          <div>
            <p className="text-[17px] font-bold text-fv-obsidian mb-1">
              These are your products. Bring your catalog.
            </p>
            <p className="text-[14px] text-fv-slate">
              Upload any garment image — FitVision segments and wraps it in under 1 second.
            </p>
          </div>
          <a
            href="/store"
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
            }}
            id="bento-open-auramart-btn"
          >
            Open AuraMart
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
