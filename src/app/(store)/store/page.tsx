"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ShoppingBag,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  X,
  ShieldCheck,
  Filter,
} from "lucide-react";
import dynamic from "next/dynamic";
import { ARProduct } from "@/components/ar/UniversalTryOnModal";
import SkinToneSelector, { SKIN_TONES, SkinToneData, ColorOption } from "@/components/ar/SkinToneSelector";
import CartDrawer, { CartItem } from "@/components/store/CartDrawer";
import { ProductReviewsSection } from "@/components/store/ProductReviewsSection";
import Link from "next/link";

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
    name: "Aura Minimalist Royal Blue Overshirt",
    category: "shirt",
    price: 148.0,
    image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80",
    description: "Tailored organic cotton overshirt with dynamic shoulder drape and matte horn buttons.",
    color: "#4169E1",
    fitStyle: "regular",
    garmentDimensions: { shoulderWidthCm: 46, chestWidthCm: 106, lengthCm: 74 },
  },
  {
    id: "prod-2",
    name: "Obsidian Heavyweight Cyber Hoodie",
    category: "hoodie",
    price: 175.0,
    image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80",
    description: "450gsm double-knit fleece hoodie with structured hood volume and relaxed dropped shoulders.",
    color: "#2563EB",
    fitStyle: "oversized",
    garmentDimensions: { shoulderWidthCm: 50, chestWidthCm: 114, lengthCm: 76 },
  },
  {
    id: "prod-3",
    name: "Emerald Waterproof Shell Jacket",
    category: "jacket",
    price: 290.0,
    image_url: "https://images.unsplash.com/photo-1544441893-675973e31985?w=600&q=80",
    description: "3-layer seam-sealed technical shell with taped seams, gold metallic trim, and storm visor.",
    color: "#097969",
    fitStyle: "tight",
    garmentDimensions: { shoulderWidthCm: 44, chestWidthCm: 100, lengthCm: 70 },
  },
  {
    id: "prod-4",
    name: "Raw Denim Selvedge Trousers",
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
    name: "Terracotta Wool Knit Sweater",
    category: "sweater",
    price: 165.0,
    image_url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80",
    description: "Warm terracotta structured knit shirt crafted from breathable merino wool blend.",
    color: "#E2725B",
    fitStyle: "regular",
    garmentDimensions: { shoulderWidthCm: 45, chestWidthCm: 104, lengthCm: 72 },
  },
  {
    id: "prod-6",
    name: "Sage Green Minimalist Jacket",
    category: "jacket",
    price: 220.0,
    image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
    description: "Lightweight structured sage jacket with concealed placket and utility chest pockets.",
    color: "#9CAF88",
    fitStyle: "regular",
  },
  {
    id: "prod-7",
    name: "Dusty Blue Relaxed Hoodie",
    category: "hoodie",
    price: 135.0,
    image_url: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&q=80",
    description: "Dusty blue French terry hoodie with double-layer hood and kangaroo pouch pocket.",
    color: "#8A9EA7",
    fitStyle: "oversized",
  },
  {
    id: "prod-8",
    name: "Burgundy Velvet Formal Shirt",
    category: "shirt",
    price: 185.0,
    image_url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80",
    description: "Rich burgundy tailored formal shirt with pointed collar lapels and French cuffs.",
    color: "#800020",
    fitStyle: "tight",
  },
  {
    id: "prod-9",
    name: "Aviator Cyber Sunglasses",
    category: "eyewear",
    price: 95.0,
    image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80",
    description: "Metallic teardrop frames with UV-blocking tinted glass lenses and brow bridge wire.",
    color: "#00F3FF",
    fitStyle: "regular",
  },
];

export default function AuraMartStorefront() {
  const [products] = useState<StoreProduct[]>(DEFAULT_STORE_PRODUCTS);
  const [apiKey, setApiKey] = useState<string>("");
  const [isApiKeyVerified, setIsApiKeyVerified] = useState<boolean>(false);
  const [partnerTier, setPartnerTier] = useState<string>("");

  // Skin Tone State
  const [activeSkinTone, setActiveSkinTone] = useState<SkinToneData>(SKIN_TONES[2]); // MEDIUM default
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [filterActive, setFilterActive] = useState<boolean>(false);

  // AR Modal State
  const [isARModalOpen, setIsARModalOpen] = useState<boolean>(false);
  const [activeARProduct, setActiveARProduct] = useState<ARProduct | null>(null);

  // Cart State & Drawer
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
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

  const handleToneSelect = (tone: SkinToneData) => {
    setActiveSkinTone(tone);
    setSelectedColor(tone.recommendedColors[0]);
    setFilterActive(true);
    scrollToCatalog();
  };

  const handleColorSelect = (color: ColorOption) => {
    setSelectedColor(color);
    setFilterActive(true);
    scrollToCatalog();
  };

  const scrollToCatalog = () => {
    const el = document.getElementById("catalog");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleOpenAR = (product: StoreProduct) => {
    setActiveARProduct({
      ...product,
      color: selectedColor ? selectedColor.hex : product.color,
    });
    setIsARModalOpen(true);
  };

  const handleAddToCart = (product: ARProduct, size: string) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.size === size
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          product,
          size,
          quantity: 1,
          colorHex: selectedColor ? selectedColor.hex : product.color,
          colorName: selectedColor ? selectedColor.name : undefined,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    setCartItems((prev) => {
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const copy = [...prev];
      copy[index].quantity = newQty;
      return copy;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const isBestSkinMatch = (productColorHex?: string) => {
    if (!productColorHex) return false;
    return activeSkinTone.recommendedColors.some(
      (c) => c.hex.toLowerCase() === productColorHex.toLowerCase()
    );
  };

  // Catalog Filtering logic
  const filteredProducts = products.filter((p) => {
    if (!filterActive || !selectedColor) return true;
    return (
      p.color?.toLowerCase() === selectedColor.hex.toLowerCase() ||
      isBestSkinMatch(p.color)
    );
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      {/* ─── Top Partner Integration Banner ────────────────────────────── */}
      <header className="border-b border-slate-100 bg-slate-50/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group" title="Return to FitVision Home">
              <img
                src="/fitvision-logo.png"
                alt="FitVision Logo"
                className="w-8 h-8 object-contain rounded-lg shadow-sm group-hover:scale-105 transition-transform"
              />
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                Fit<span className="text-blue-600">Vision</span>
              </span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-black tracking-tighter text-slate-800 font-mono">
              AURA<span className="text-blue-600">MART</span>
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
              activeColorHex={selectedColor?.hex}
              onSelectTone={handleToneSelect}
              onSelectColor={handleColorSelect}
              showPosterMode={true}
            />
          </div>
        </div>
      </section>

      {/* ─── Sticky Filter Banner ───────────────────────────────────── */}
      {filterActive && selectedColor && (
        <div className="sticky top-[57px] z-20 bg-slate-900 text-white shadow-lg border-y border-slate-800 py-3 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span className="text-xs font-bold tracking-wide">
                Filtered by: <strong className="text-amber-400">{selectedColor.name}</strong> • Best Match for{" "}
                <strong className="text-blue-400">{activeSkinTone.label}</strong> Skin
              </span>
            </div>

            <button
              onClick={() => {
                setFilterActive(false);
                setSelectedColor(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Product Catalog Grid ────────────────────────────────────── */}
      <section id="catalog" className="max-w-7xl mx-auto px-6 py-16 scroll-mt-24">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Curated Catalog ({filteredProducts.length})
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Filtered for <strong className="text-blue-600">{activeSkinTone.label}</strong> Skin Tone Palette
            </span>
          </div>

          <div className="flex items-center gap-2">
            {filterActive && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>Active Filter</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((item) => {
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
                        ⭐ 98% Match for Your Skin Tone
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

      {/* ─── Social Circle Reviews & AI Fake Review Shield Section ───────── */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100">
        <ProductReviewsSection productName="Aura Store Collection" />
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

      {/* Persistent Shopping Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
      />

      {/* Phase 3 AR Fit Engine Modal */}
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
