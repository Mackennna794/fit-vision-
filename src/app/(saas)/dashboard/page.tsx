"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  ArrowDownRight,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Palette,
  BarChart3,
  Activity,
  Layers,
  Store,
  Key,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/saas/Header";

export default function SellerDashboardPage() {
  const [apiKey, setApiKey] = useState<string>("fv_live_demo_hackathon_2026");
  const [keyStatus, setKeyStatus] = useState<{
    valid: boolean;
    tier?: string;
    organization?: string;
    message?: string;
  }>({
    valid: true,
    tier: "Enterprise Tier",
    organization: "AuraMart Luxury Retail",
  });
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const verifyApiKey = async (key: string) => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/v1/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
      });
      const data = await res.json();
      setKeyStatus(data);
    } catch (err) {
      setKeyStatus({ valid: false, message: "Network verification error" });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("auramart_fv_key") || "fv_live_demo_hackathon_2026";
      setApiKey(storedKey);
      verifyApiKey(storedKey);
    }
  }, []);

  const skinToneUsage = [
    { label: "Dark (#4A2C1D)", pct: 18, color: "#4A2C1D", barColor: "bg-[#4A2C1D]" },
    { label: "Brown (#8D5524)", pct: 32, color: "#8D5524", barColor: "bg-[#8D5524]" },
    { label: "Medium (#C68642)", pct: 26, color: "#C68642", barColor: "bg-[#C68642]" },
    { label: "Light Medium (#E0AC69)", pct: 14, color: "#E0AC69", barColor: "bg-[#E0AC69]" },
    { label: "Light (#F1C27D)", pct: 10, color: "#F1C27D", barColor: "bg-[#F1C27D]" },
  ];

  const topGarments = [
    { name: "CyberPunk Oversized Hoodie", category: "Hoodie", tryCount: "14,290", addToBagRate: "42.8%", conversion: "18.4%" },
    { name: "Obsidian Heavyweight Hoodie", category: "Top", tryCount: "11,840", addToBagRate: "39.1%", conversion: "16.2%" },
    { name: "Aura Minimalist Overshirt", category: "Shirt", tryCount: "9,620", addToBagRate: "36.5%", conversion: "14.8%" },
    { name: "Nordic Wool Knit Sweater", category: "Sweater", tryCount: "8,450", addToBagRate: "34.0%", conversion: "13.9%" },
    { name: "Emerald Waterproof Shell", category: "Jacket", tryCount: "6,910", addToBagRate: "31.2%", conversion: "12.5%" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-16 space-y-8">
        {/* Top Header & Overview Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Seller Telemetry & Enterprise Dashboard
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Real-time analytics for 3D AR Virtual Try-On, fit ML accuracy, and skin tone shopping conversions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/store"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-100 transition-colors shadow-xs"
            >
              <Store className="w-4 h-4 text-blue-600" />
              <span>View AuraMart Live Store</span>
            </Link>
          </div>
        </div>

        {/* ─── 1. Executive Metrics Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Try-On Engagement Rate */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Try-On Engagement Rate</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">78.4%</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +14.2% MoM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Active shopper camera try-on sessions vs total visitors
            </p>
          </div>

          {/* Card 2: Return Rate Reduction */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Return Rate Reduction</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600">-34.8%</span>
              <span className="text-xs font-bold text-emerald-600">Avoided</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Size & color discrepancy returns eliminated via AR
            </p>
          </div>

          {/* Card 3: Average Basket Size */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Average Basket Size</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">$142.50</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +28% with AR
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Higher cart value when try-on modal is engaged
            </p>
          </div>

          {/* Card 4: API Quota Meter */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-3">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>API Quota Meter</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-900 mb-1">
                <span>142,890 / 250,000</span>
                <span className="text-purple-600 font-mono">57.1%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full w-[57.1%]" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Status: <strong className="text-emerald-600 font-bold">{keyStatus.valid ? "Active" : "Unverified"}</strong></span>
              <span className="text-slate-400 font-mono">Plan: Enterprise</span>
            </div>
          </div>
        </div>

        {/* ─── 2. Supabase / FitVision Key Verification Panel ─────────────────── */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight">Supabase & FitVision API Validation</h3>
                <p className="text-xs text-slate-400">
                  Verify production seller key authentication connected to `/api/v1/verify-key`.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {keyStatus.valid ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified ({keyStatus.tier || "Enterprise"})</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold">
                  Invalid Key
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="fv_live_..."
              className="w-full sm:flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => verifyApiKey(apiKey)}
              disabled={isVerifying}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
            >
              {isVerifying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>Test Key Endpoint</span>
            </button>
          </div>
        </div>

        {/* ─── 3. Charts & Usage Analytics Grid ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Skin Tone Palette Usage Chart */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-500" />
                  Hand Skin Tone Palette Selection
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Percentage of storefront users selecting each hand tone palette card.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {skinToneUsage.map((tone) => (
                <div key={tone.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: tone.color }} />
                      {tone.label}
                    </span>
                    <span className="font-mono text-slate-900">{tone.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${tone.pct}%`, backgroundColor: tone.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 text-xs text-slate-600 font-medium">
              <strong className="text-slate-900 block mb-0.5">💡 Insight:</strong>
              Brown (#8D5524) and Medium (#C68642) account for 58% of total try-on sessions. Warm Earthy and Jewel tone recommendations yield 24% higher add-to-bag rates.
            </div>
          </div>

          {/* Right: Top Tried-On Garments Table */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Top Tried-On Garments
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Performance breakdown for items in 3D AR Try-On canvas.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                    <th className="pb-3">Garment Name</th>
                    <th className="pb-3 text-right">Try Count</th>
                    <th className="pb-3 text-right">Add-to-Bag %</th>
                    <th className="pb-3 text-right">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {topGarments.map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-bold text-slate-900 truncate max-w-[160px]">
                        {g.name}
                        <span className="block text-[10px] font-normal text-slate-400">{g.category}</span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">{g.tryCount}</td>
                      <td className="py-3 text-right font-bold text-blue-600">{g.addToBagRate}</td>
                      <td className="py-3 text-right font-bold text-emerald-600">{g.conversion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-xs text-blue-900 font-medium">
              <strong className="block mb-0.5 font-bold">🚀 Category Trend:</strong>
              Hoodies and Overshirts demonstrate the highest AR engagement rates with size recommendations matching user proportions 99.2% of the time.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
