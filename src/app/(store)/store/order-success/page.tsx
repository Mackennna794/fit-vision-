"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShoppingBag, Download, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { CartItem } from "@/components/store/CartDrawer";

interface OrderData {
  txId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    zip: string;
  };
  placedAt: string;
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const txIdParam = searchParams.get("tx_id");

  const [order, setOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedOrder = localStorage.getItem("auramart_last_order");
    if (storedOrder) {
      try {
        setOrder(JSON.parse(storedOrder));
      } catch (e) {}
    }
  }, []);

  const displayTxId = txIdParam || order?.txId || "FV-2026-894120";

  return (
    <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-10 space-y-8">
      {/* Top Success Icon & Badge */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5" />
          Order Confirmed & Paid
        </span>

        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Thank you for your order!
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Your FitVision AR purchase has been received and is being processed for express delivery.
        </p>
      </div>

      {/* Transaction Meta Card */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 grid grid-cols-2 gap-4 text-xs font-mono">
        <div>
          <span className="text-slate-400 block text-[11px] font-sans">Transaction ID</span>
          <strong className="text-blue-600 font-bold">{displayTxId}</strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] font-sans">Date & Time</span>
          <strong className="text-slate-800">
            {order?.placedAt ? new Date(order.placedAt).toLocaleDateString() : new Date().toLocaleDateString()}
          </strong>
        </div>
      </div>

      {/* Items Purchased Receipt */}
      {order && order.items && order.items.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Purchased Items</h3>
          <div className="divide-y divide-slate-100 border-y border-slate-100 py-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.product.name}</h4>
                    <span className="text-slate-500 text-[11px]">
                      Size: {item.size} • Qty: {item.quantity}
                    </span>
                  </div>
                </div>
                <span className="font-black text-slate-900">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 font-medium pt-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8%)</span>
              <span className="font-bold text-slate-900">${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Paid</span>
              <span className="text-blue-600">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Address Summary */}
      {order?.shippingAddress && (
        <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/60 text-xs text-slate-600 space-y-1">
          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-1">
            Shipping Destination
          </span>
          <p className="font-bold text-slate-800">{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.address}</p>
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.zip}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <Link
          href="/store"
          className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full sm:w-auto py-3.5 px-5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Print Receipt</span>
        </button>
      </div>

      <div className="text-center pt-2">
        <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          FitVision Verified AR Transaction Receipt
        </span>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white py-12 px-6 flex items-center justify-center">
      <Suspense fallback={<div className="text-xs font-bold text-slate-500">Loading order receipt...</div>}>
        <OrderSuccessContent />
      </Suspense>
    </div>
  );
}
