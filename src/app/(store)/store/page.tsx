"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ShoppingBag,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import dynamic from "next/dynamic";
import { ARProduct } from "@/components/ar/UniversalTryOnModal";
import SkinToneSelector, { SKIN_TONES, SkinToneData } from "@/components/ar/SkinToneSelector";

// SSR Bypass for AR Try-On Modal
const UniversalTryOnModal = dynamic(
  () => import("@/components/ar/UniversalTryOnModal"),
  { ssr: false }
);

interface StoreProduct extends ARProduct {
  inStock?: boolean;
}

const DEFAULT_STORE_PRODUCTS: StoreProduct[] = [
  {
    id: "prod-1",
    name: "Aura Minimalist Overshirt",
    category: "top",
    price: 148.0,
    image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80",
    description: "Tailored organic cotton overshirt with dynamic shoulder drape and matte horn buttons.",
    color: "#2563EB",
    fitStyle: "regular",
    garmentDimensions: { shoulderWidthCm: 46, chestWidthCm: 106, lengthCm: 74 },
  },
  {
    id: "prod-2",
    name: "Obsidian Heavyweight Hoodie",
    category: "top",
    price: 175.0,
    image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80",
    description: "450gsm double-knit fleece hoodie with structured hood volume and relaxed dropped shoulders.",
    color: "#0F172A",
    fitStyle: "oversized",
    garmentDimensions: { shoulderWidthCm: 50, chestWidthCm: 114, lengthCm: 76 },
  },
  {
    id: "prod-3",
    name: "Emerald Waterproof Shell Jacket",
    category: "top",
    price: 290.0,
    image_url: "https://images.unsplash.com/photo-1544441893-675973e31985?w=600&q=80",
    description: "3-layer seam-sealed technical shell with taped seams, gold metallic trim, and storm visor.",
    color: "#097969",
    fitStyle: "tight",
    garmentDimensions: { shoulderWidthCm: 44, chestWidthCm: 100, lengthCm: 70 },
  },
  {
    id: "prod-4",
    name: "Raw Denim Selvedge Jeans",
    category: "bottom",
    price: 210.0,
    image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80",
    description: "14.5oz shuttle-woven selvedge denim with clean taper legs and reinforced pocket rivets.",
    color: "#000080",
    fitStyle: "regular",
    garmentDimensions: { shoulderWidthCm: 42, chestWidthCm: 90, lengthCm: 104, hipWidthCm: 96 },
  },
  {
    id: "prod-5",
    name: "Terracotta Knit Overshirt",
    category: "top",
    price: 165.0,
    image_url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80",
    description: "Warm terracotta structured knit shirt crafted from breathable merino wool blend.",
    color: "#E2725B",
    fitStyle: "regular",
    garmentDimensions: { shoulderWidthCm: 45, chestWidthCm: 104, lengthCm: 72 },
  },
];

export default function AuraMartStorefront() {
  const [products, setProducts] = useState<StoreProduct[]>(DEFAULT_STORE_PRODUCTS);
  const [apiKey, setApiKey] = useState<string>("");
  const [isApiKeyVerified, setIsApiKeyVerified] = useState<boolean>(false);
  const [partnerTier, setPartnerTier] = useState<string>("");

  // Skin Tone State
  const [activeSkinTone, setActiveSkinTone] = useState<SkinToneData>(SKIN_TONES[2]);
  const [selectedColorHex, setSelectedColorHex] = useState<string>("#2563EB");

  // AR Modal State
  const [isARModalOpen, setIsARModalOpen] = useState<boolean>(false);
  const [activeARProduct, setActiveARProduct] = useState<ARProduct | null>(null);

  // Cart State
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<{ product: ARProduct; size: string; quantity: number }[]>([]);
  const [isAdminDrawerOpen, setIsAdminDrawerOpen] = useState<boolean>(false);

  // B2B Key Verification
  const verifyKey = useCallback(async (keyToTest: string) => {
    if (!keyToTest) return;
    try {
      const res = await fetch("/api/v1/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyToTest }),
      });
      const data = await res.json();
      if (data.valid) {
        setIsApiKeyVerified(true);
        setPartnerTier(data.tier || "Enterprise Tier");
        setApiKey(keyToTest);
        if (typeof window !== "undefined") {
          localStorage.setItem("auramart_fv_key", keyToTest);
        }
      } else {
        setIsApiKeyVerified(false);
      }
    } catch (e) {
      console.warn("API Key Verification error:", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const paramKey = urlParams.get("api_key");
    const storedKey = localStorage.getItem("auramart_fv_key");

    const keyToUse = paramKey || storedKey || "fv_live_demo_hackathon_2026";
    setApiKey(keyToUse);
    verifyKey(keyToUse);

    const savedCart = localStorage.getItem("auramart_cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {}
    }
  }, [verifyKey]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("auramart_cart", JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const handleOpenAR = (product: StoreProduct) => {
    setActiveARProduct({
      ...product,
      color: selectedColorHex || product.color,
    });
    setIsARModalOpen(true);
  };

  const handleAddToCart = (product: ARProduct, size: string) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id && item.size === size);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, size, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const isBestSkinMatch = (productColorHex?: string) => {
    if (!productColorHex) return false;
    return activeSkinTone.recommendedColors.some(
      (c) => c.hex.toLowerCase() === productColorHex.toLowerCase()
    );
  };

  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const freeShippingThreshold = 250;
  const freeShippingProgress = Math.min(100, (cartSubtotal / freeShippingThreshold) * 100);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      {/* ─── Top Partner Integration Banner ────────────────────────────── */}
      <header className="border-b border-slate-100 bg-slate-50/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tighter text-slate-900 font-mono">
              AURA<span className="text-blue-600">MART</span>
            </span>
            <span className="text-xs font-semibold text-slate-400 pl-3 border-l border-slate-200">
              Scandinavian Minimalist Retail
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isApiKeyVerified ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>FitVision AR Connected ({partnerTier})</span>
              </div>
            ) : (
              <button
                onClick={() => setIsAdminDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Connect FitVision AR Key</span>
              </button>
            )}

            <button
              onClick={() => setIsAdminDrawerOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Merchant B2B Admin Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Bag ({cartItems.reduce((a, b) => a + b.quantity, 0)})</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero Section with Skin Tone Matcher Filter ────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-b border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block">
              Autumn / Winter 2026 Collection
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.05]">
              Form follows fit. <br />
              <span className="text-slate-400">Pure luxury in motion.</span>
            </h1>
            <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-xl">
              Discover precision-tailored garments powered by client-side AI and hand skin tone palette matching. Instant virtual fitting, zero returns.
            </p>
          </div>

          {/* Interactive Skin Tone Palette Selector Component */}
          <div className="lg:col-span-12">
            <SkinToneSelector
              activeSkinToneId={activeSkinTone.id}
              activeColorHex={selectedColorHex}
              onSelectTone={(tone) => setActiveSkinTone(tone)}
              onSelectColor={(col) => setSelectedColorHex(col.hex)}
              showPosterMode={true}
            />
          </div>
        </div>
      </section>

      {/* ─── Product Catalog Grid ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Curated Catalog ({products.length})
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Filtered for <strong className="text-blue-600">{activeSkinTone.label}</strong> Skin Tone Palette
            </span>
          </div>

          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Showing all categories • Real-time AR unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((item) => {
            const isMatch = isBestSkinMatch(item.color);
            return (
              <div
                key={item.id}
                className={`group relative bg-white rounded-3xl border p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                  isMatch ? "border-amber-400/80 ring-2 ring-amber-400/20" : "border-slate-200/80"
                }`}
              >
                <div>
                  {/* Product Image Card */}
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100 mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Category Tag */}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-slate-900 shadow-sm">
                      {item.category}
                    </span>

                    {/* Skin Tone Match Badge */}
                    {isMatch && (
                      <span className="absolute top-3 right-3 bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider shadow-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-slate-950" />
                        Best Match
                      </span>
                    )}
                  </div>

                  {/* Product Meta */}
                  <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-base font-black text-slate-900">${item.price.toFixed(2)}</span>
                    <span className="text-xs font-semibold text-slate-400">
                      Fit: <strong className="text-slate-700 uppercase">{item.fitStyle || "regular"}</strong>
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-2">
                  {isApiKeyVerified && (
                    <button
                      onClick={() => handleOpenAR(item)}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>⚡ Try On with FitVision AR</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleAddToCart(item, "M")}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Merchant B2B Integration Admin Drawer ─────────────────────── */}
      {isAdminDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    FitVision Partner Integration Gateway
                  </h3>
                </div>
                <button
                  onClick={() => setIsAdminDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    FitVision Live API Key (fv_live_...)
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="fv_live_demo_hackathon_2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <button
                  onClick={() => verifyKey(apiKey)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify API Key</span>
                </button>

                <div
                  className={`p-4 rounded-2xl border text-xs ${
                    isApiKeyVerified
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {isApiKeyVerified
                        ? `Connected (${partnerTier})`
                        : "Key Not Verified"}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {isApiKeyVerified
                      ? "FitVision 3D AR Try-On & ML Sizing engine is active across all product catalog cards."
                      : "Enter a valid production key starting with fv_live_ to unlock real-time AR buttons."}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center">
              <span className="text-[11px] text-slate-400">
                FitVision B2B SaaS Integration Directive • Hackathon 2026
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Persistent Shopping Cart Slide-Over Drawer ──────────────────── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-slate-900" />
                  <h3 className="text-base font-extrabold text-slate-900">Your Cart</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 mb-6 text-xs">
                <div className="flex justify-between mb-1.5 font-bold text-slate-700">
                  <span>Free Express Shipping</span>
                  <span>
                    {cartSubtotal >= freeShippingThreshold
                      ? "Unlocked!"
                      : `$${(freeShippingThreshold - cartSubtotal).toFixed(2)} away`}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  Your bag is empty. Explore the collection above!
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item, idx) => (
                    <div
                      key={`${item.product.id}-${item.size}-${idx}`}
                      className="flex items-center justify-between border-b border-slate-100 pb-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{item.product.name}</h4>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Size: <strong className="text-slate-900">{item.size}</strong> • ${item.product.price.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Subtotal</span>
                <span>${cartSubtotal.toFixed(2)}</span>
              </div>
              <button
                disabled={cartItems.length === 0}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-md"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Phase 3 AR Fit Engine Modal ────────────────────────────────── */}
      {isARModalOpen && (
        <UniversalTryOnModal
          isOpen={isARModalOpen}
          onClose={() => setIsARModalOpen(false)}
          product={activeARProduct}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
