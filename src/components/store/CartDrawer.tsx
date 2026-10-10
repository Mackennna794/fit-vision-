"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { ARProduct } from "@/components/ar/UniversalTryOnModal";
import Link from "next/link";

export interface CartItem {
  product: ARProduct;
  size: string;
  quantity: number;
  colorHex?: string;
  colorName?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart?: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
}: CartDrawerProps) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = 0; // Free Hackathon Demo Shipping
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const freeShippingThreshold = 200;
  const shippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex justify-end">
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l border-slate-200"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-900 text-white">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Your AuraMart Bag</h3>
                <span className="text-xs text-slate-500 font-medium">
                  {totalItemCount} {totalItemCount === 1 ? "item" : "items"} selected
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
              aria-label="Close Cart Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Free Shipping Meter Banner */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Free Express Hackathon Shipping
                </span>
                <span className="text-blue-600">
                  {subtotal >= freeShippingThreshold
                    ? "Unlocked!"
                    : `$${(freeShippingThreshold - subtotal).toFixed(2)} away`}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>

            {/* Empty State UI */}
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Your bag is empty</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Try on garments in 3D AR or select recommended skin tone palettes to add items.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Browse Store Collection
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${item.size}-${idx}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-16 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                        {item.colorHex && (
                          <span
                            className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: item.colorHex }}
                          />
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.product.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <span>Size: <strong className="text-slate-800">{item.size}</strong></span>
                          <span>•</span>
                          <span className="text-slate-900 font-bold">${item.product.price.toFixed(2)}</span>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-2 pt-1">
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                            <button
                              onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                              className="p-1 text-slate-600 hover:bg-slate-200 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-bold text-slate-900">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                              className="p-1 text-slate-600 hover:bg-slate-200 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Single-Click Item Deletion & Line Total */}
                    <div className="flex flex-col items-end justify-between h-full py-1">
                      <button
                        onClick={() => onRemoveItem(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-black text-slate-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Breakdown & Proceed to Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
              <div className="space-y-2 text-xs font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Shipping</span>
                  <span className="font-bold text-emerald-600">FREE ($0.00)</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-bold text-slate-900">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Final Total</span>
                  <span className="text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/store/checkout"
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted Enterprise Checkout • Instant Fulfillment</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
