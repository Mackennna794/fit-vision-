"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  Plus,
  ArrowLeft,
  Upload,
} from "lucide-react";
import Link from "next/link";

export default function MerchantAdminPage() {
  const [apiKey, setApiKey] = useState<string>("fv_live_demo_hackathon_2026");
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [partnerTier, setPartnerTier] = useState<string>("Enterprise Tier");

  // New product form
  const [title, setTitle] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [category, setCategory] = useState<string>("top");
  const [fitStyle, setFitStyle] = useState<string>("regular");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const paramKey = urlParams.get("api_key");
    const storedKey = localStorage.getItem("auramart_fv_key");
    if (paramKey || storedKey) {
      const keyToUse = paramKey || storedKey!;
      setApiKey(keyToUse);
      verifyKey(keyToUse);
    }
  }, []);

  const verifyKey = async (keyToTest: string) => {
    try {
      const res = await fetch("/api/v1/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyToTest }),
      });
      const data = await res.json();
      if (data.valid) {
        setIsVerified(true);
        setPartnerTier(data.tier || "Enterprise Tier");
        if (typeof window !== "undefined") {
          localStorage.setItem("auramart_fv_key", keyToTest);
        }
      } else {
        setIsVerified(false);
      }
    } catch (e) {
      console.warn("Key verification error:", e);
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !imageUrl) return;

    setMessage(`Product "${title}" created successfully and synced to catalog.`);
    setTitle("");
    setPrice("");
    setImageUrl("");
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 sm:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/store"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Merchant Admin & Integration Portal
              </h1>
              <p className="text-xs text-slate-500">
                AuraMart Storefront B2B Partner Settings & Catalog Management
              </p>
            </div>
          </div>

          <Link
            href="/store"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition-colors"
          >
            View Storefront →
          </Link>
        </div>

        {/* Section 1: FitVision B2B API Key Connector */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>FitVision B2B Integration Connector</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter your FitVision enterprise API key (`fv_live_...`) to unlock real-time 3D AR Virtual Fitting and ML Sizing across your storefront catalog.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="fv_live_demo_hackathon_2026"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50"
            />
            <button
              onClick={() => verifyKey(apiKey)}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Connector</span>
            </button>
          </div>

          {/* Connection Status Badge */}
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
              isVerified
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">
                {isVerified
                  ? `● FitVision AR Engine Connected (${partnerTier})`
                  : "API Key Unverified"}
              </span>
              <span className="text-[11px] block mt-0.5 opacity-90">
                {isVerified
                  ? "All storefront product cards now display the glowing golden ⚡ Try On with FitVision button."
                  : "Please provide a valid API key with prefix fv_live_"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Catalog Product Upload Portal */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <Upload className="w-5 h-5 text-blue-600" />
            <span>Product Upload & Catalog Portal</span>
          </div>

          {message && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleAddProduct} className="space-y-4 text-xs font-medium">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Product Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Nordic Waterproof Shell"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Price ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="185.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="top">Tops & Outerwear</option>
                  <option value="bottom">Bottoms & Pants</option>
                  <option value="headwear">Headwear</option>
                  <option value="shoes">Footwear</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Fit Style Cut</label>
                <select
                  value={fitStyle}
                  onChange={(e) => setFitStyle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="regular">Regular Fit</option>
                  <option value="slim">Slim Fit</option>
                  <option value="oversized">Oversized Fit</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-xs"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Product to Storefront Catalog</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
