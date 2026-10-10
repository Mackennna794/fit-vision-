"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, CreditCard, ShieldCheck, ArrowLeft, CheckCircle2, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { CartItem } from "@/components/store/CartDrawer";

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: "Lasya",
    email: "lasya@fitvision.ai",
    address: "100 Innovation Way, Suite 400",
    city: "San Francisco",
    state: "CA",
    zip: "94105",
    paymentMethod: "card",
    cardNumber: "•••• •••• •••• 4242",
    expDate: "12/28",
    cvv: "888",
    upiId: "lasya@okaxis",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedCart = localStorage.getItem("auramart_cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {}
    }
  }, []);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shipping = 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Generate Transaction ID & Receipt Details
    const txId = `FV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderData = {
      txId,
      items: cartItems,
      subtotal,
      tax,
      total,
      shippingAddress: formData,
      placedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      // Clear Cart from State & LocalStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("auramart_cart");
        localStorage.setItem("auramart_last_order", JSON.stringify(orderData));
      }
      setIsProcessing(false);
      router.push(`/store/order-success?tx_id=${txId}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/store"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to AuraMart Store</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter text-slate-900 font-mono">
              AURA<span className="text-blue-600">MART</span>
            </span>
            <span className="text-xs font-semibold text-slate-400 pl-2 border-l border-slate-200">
              Checkout Gateway
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <Lock className="w-3.5 h-3.5" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Enterprise Order Checkout</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete your order details below to finalize your FitVision AR purchase.
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Your shopping bag is empty</h3>
            <p className="text-xs text-slate-500">
              There are no items in your cart to checkout. Please return to the storefront.
            </p>
            <Link
              href="/store"
              className="inline-block px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
            >
              Go to Storefront
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Form Details */}
            <div className="lg:col-span-7 space-y-6">
              {/* Shipping Address Section */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">1. Shipping Address</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ZIP / Postal Code</label>
                    <input
                      type="text"
                      name="zip"
                      required
                      value={formData.zip}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">2. Payment Method</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "card", label: "Credit / Debit Card" },
                    { id: "upi", label: "Instant UPI Pay" },
                    { id: "demo", label: "Hackathon Demo Pay" },
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: pm.id })}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                        formData.paymentMethod === pm.id
                          ? "border-blue-600 bg-blue-50 text-blue-900 shadow-xs ring-2 ring-blue-500/20"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>

                {formData.paymentMethod === "card" && (
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium pt-2">
                    <div className="col-span-2">
                      <label className="block text-slate-700 font-bold mb-1">Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Expiration</label>
                      <input
                        type="text"
                        name="expDate"
                        value={formData.expDate}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono"
                      />
                    </div>
                  </div>
                )}

                {formData.paymentMethod === "upi" && (
                  <div className="text-xs font-medium pt-2">
                    <label className="block text-slate-700 font-bold mb-1">VPA / UPI ID</label>
                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono"
                    />
                  </div>
                )}

                {formData.paymentMethod === "demo" && (
                  <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900">
                    <span className="font-bold block mb-0.5">⭐ Hackathon Instant Express Approval</span>
                    Payment is automatically authorized for testing purposes.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 sticky top-24">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Order Summary ({cartItems.length} items)
                </h3>

                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {cartItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 line-clamp-1">{item.product.name}</h4>
                          <span className="text-slate-500 text-[11px]">
                            Qty: {item.quantity} • Size {item.size}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600 font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-bold text-emerald-600">FREE ($0.00)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Tax (8%)</span>
                    <span className="font-bold text-slate-900">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
                    <span>Total Amount</span>
                    <span className="text-blue-600">${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Authorizing Order...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Place Order • ${total.toFixed(2)}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>30-Day Guarantee • Instant AR Fit Receipt</span>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
