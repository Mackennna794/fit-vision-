'use client';

import React, { useState } from 'react';
import {
  Star,
  Users,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Filter,
  MessageSquare,
  ThumbsUp,
  Award,
  Bot,
  UserCheck,
  Send,
  X,
  Gift,
  DollarSign,
  Search,
} from 'lucide-react';

export interface ReviewItem {
  id: string;
  author: string;
  avatarUrl?: string;
  isFriend: boolean;
  friendName?: string;
  isVerifiedBuyer: boolean;
  reviewType: 'organic' | 'paid' | 'free_product' | 'ai_generated';
  isAiFlagged: boolean;
  isPaidFlagged: boolean;
  aiDetectionScore: number; // 0 to 100 (% confidence of human authenticity)
  aiReason?: string;
  rating: number;
  date: string;
  fitPurchased: string;
  content: string;
  likes: number;
}

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    author: 'Rahul Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    isFriend: true,
    friendName: 'Rahul',
    isVerifiedBuyer: true,
    reviewType: 'organic',
    isAiFlagged: false,
    isPaidFlagged: false,
    aiDetectionScore: 100,
    rating: 5,
    date: '3 days ago',
    fitPurchased: 'Size M • Royal Blue',
    content:
      'Fabric drapes perfectly over the shoulders without any tight restriction. Size M fits spot-on based on the FitVision 3D camera recommendation!',
    likes: 14,
  },
  {
    id: 'rev-2',
    author: 'Ananya Roy',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    isFriend: true,
    friendName: 'Ananya',
    isVerifiedBuyer: true,
    reviewType: 'organic',
    isAiFlagged: false,
    isPaidFlagged: false,
    aiDetectionScore: 99,
    rating: 5,
    date: '1 week ago',
    fitPurchased: 'Size S • Royal Blue',
    content:
      'Color matches the live AR view exactly. The material feels premium heavy cotton and doesn’t shrink after wash.',
    likes: 9,
  },
  {
    id: 'rev-3',
    author: 'Vikram Malhotra',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80',
    isFriend: true,
    friendName: 'Vikram',
    isVerifiedBuyer: true,
    reviewType: 'organic',
    isAiFlagged: false,
    isPaidFlagged: false,
    aiDetectionScore: 97,
    rating: 4,
    date: '2 weeks ago',
    fitPurchased: 'Size L • Obsidian Black',
    content:
      'Really great fit around torso. Sleeve length is slightly long but looks intentional for an oversized streetwear look.',
    likes: 6,
  },
  {
    id: 'rev-4',
    author: 'Marcus Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    isFriend: false,
    isVerifiedBuyer: true,
    reviewType: 'organic',
    isAiFlagged: false,
    isPaidFlagged: false,
    aiDetectionScore: 95,
    rating: 4,
    date: '3 weeks ago',
    fitPurchased: 'Size M • Emerald Green',
    content:
      'Very crisp stitching and premium feel. Delivery took only 2 days.',
    likes: 4,
  },
  {
    id: 'rev-5',
    author: 'User_89231',
    isFriend: false,
    isVerifiedBuyer: false,
    reviewType: 'ai_generated',
    isAiFlagged: true,
    isPaidFlagged: false,
    aiDetectionScore: 12, // 88% bot confidence
    aiReason:
      'Flagged by FitVision AI: Synthetic vocabulary cluster ("unparalleled ergonomics", "pristine synthesis") & bot posting signature.',
    rating: 5,
    date: '1 day ago',
    fitPurchased: 'Size L',
    content:
      'This item is truly revolutionary! The exceptional quality, unparalleled comfort, dynamic ergonomics, and pristine aesthetic synthesize into an absolute masterpiece of modern apparel engineering!',
    likes: 0,
  },
  {
    id: 'rev-6',
    author: 'Promo_Spot_99',
    isFriend: false,
    isVerifiedBuyer: false,
    reviewType: 'paid',
    isAiFlagged: false,
    isPaidFlagged: true,
    aiDetectionScore: 20,
    aiReason:
      'Flagged by FitVision Guard: Disclosed / detected paid promotional text pattern with affiliate discount codes.',
    rating: 5,
    date: '4 days ago',
    fitPurchased: 'Size XL',
    content:
      'MUST BUY BEST SHIRT EVER 10/10! USE MY PROMO CODE DISCOUNT50 FOR 50% OFF ENTIRE STORE RIGHT NOW!',
    likes: 1,
  },
];

interface ProductReviewsSectionProps {
  productName?: string;
  productId?: string;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productName = 'Aura Minimalist Collection',
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'friends' | 'verified' | 'paid' | 'ai'>('all');
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // Form State for Write Review Modal
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newContent, setNewContent] = useState('');
  const [selectedType, setSelectedType] = useState<'organic' | 'paid' | 'free_product' | 'ai_generated'>('organic');

  // Live NLP AI & Fake/Paid Review Detector Algorithm
  const analyzeReviewText = (
    text: string,
    type: 'organic' | 'paid' | 'free_product' | 'ai_generated'
  ): { score: number; label: string; color: string; isAi: boolean; isPaid: boolean; reason?: string } => {
    if (type === 'paid') {
      return {
        score: 25,
        label: '🟡 Paid / Sponsored Review Disclosed',
        color: 'text-amber-400',
        isAi: false,
        isPaid: true,
        reason: 'Flagged: User explicitly disclosed this is a Paid / Sponsored promotional review.',
      };
    }

    if (type === 'free_product') {
      return {
        score: 70,
        label: '🎁 Incentive Free Product Review',
        color: 'text-purple-400',
        isAi: false,
        isPaid: true,
        reason: 'Note: Reviewer received a free product or trial item.',
      };
    }

    if (type === 'ai_generated') {
      return {
        score: 15,
        label: '⚠️ Flagged: AI-Assisted Text Disclosed',
        color: 'text-amber-500',
        isAi: true,
        isPaid: false,
        reason: 'Flagged by FitVision AI: User indicated AI-assisted text generation.',
      };
    }

    // Natural text analysis
    if (!text || text.length < 8) {
      return { score: 100, label: 'Type review message to scan...', color: 'text-slate-400', isAi: false, isPaid: false };
    }

    const lower = text.toLowerCase();
    const aiKeywords = [
      'revolutionary',
      'unparalleled',
      'synthesize',
      'masterpiece of apparel',
      'exceptional quality',
      'pristine aesthetic',
    ];
    const paidKeywords = ['discount50', 'promo code', 'click link in bio', 'sponsor', 'paid review'];

    let aiHits = 0;
    let paidHits = 0;

    aiKeywords.forEach((w) => {
      if (lower.includes(w)) aiHits++;
    });
    paidKeywords.forEach((w) => {
      if (lower.includes(w)) paidHits++;
    });

    if (paidHits > 0) {
      return {
        score: 30,
        label: '🟡 Flagged: Promotional / Paid Keywords',
        color: 'text-amber-400',
        isAi: false,
        isPaid: true,
        reason: 'Flagged by FitVision Guard: Contains promotional discount codes or affiliate link patterns.',
      };
    }

    if (aiHits >= 2) {
      return {
        score: 20,
        label: '⚠️ Flagged: High Bot / AI Vocabulary Pattern',
        color: 'text-amber-500',
        isAi: true,
        isPaid: false,
        reason: 'Flagged by FitVision AI: Overly synthetic vocabulary & bot posting pattern detected.',
      };
    }

    return {
      score: 98,
      label: '🟢 Genuine Human Writing Pattern',
      color: 'text-emerald-400',
      isAi: false,
      isPaid: false,
    };
  };

  const currentAnalysis = analyzeReviewText(newContent, selectedType);

  // Filtered Reviews
  const filteredReviews = reviewsList.filter((rev) => {
    const matchesSearch =
      rev.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'friends') return rev.isFriend;
    if (activeFilter === 'verified') return rev.isVerifiedBuyer && !rev.isAiFlagged && !rev.isPaidFlagged;
    if (activeFilter === 'paid') return rev.isPaidFlagged || rev.reviewType === 'paid';
    if (activeFilter === 'ai') return rev.isAiFlagged || rev.reviewType === 'ai_generated';

    return true;
  });

  const friendCount = reviewsList.filter((r) => r.isFriend).length;
  const paidCount = reviewsList.filter((r) => r.isPaidFlagged || r.reviewType === 'paid').length;
  const aiCount = reviewsList.filter((r) => r.isAiFlagged || r.reviewType === 'ai_generated').length;

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const analysis = analyzeReviewText(newContent, selectedType);

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      author: newAuthor.trim() || 'Verified Shopper',
      isFriend: false,
      isVerifiedBuyer: selectedType === 'organic',
      reviewType: selectedType,
      isAiFlagged: analysis.isAi,
      isPaidFlagged: analysis.isPaid,
      aiDetectionScore: analysis.score,
      aiReason: analysis.reason,
      rating: newRating,
      date: 'Just now',
      fitPurchased: 'Size M • Verified Order',
      content: newContent,
      likes: 0,
    };

    setReviewsList([newRev, ...reviewsList]);
    setNewContent('');
    setNewAuthor('');
    setSelectedType('organic');
    setIsWriteModalOpen(false);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-slate-100 shadow-2xl space-y-8">
      {/* Header Banner with Metallic 3D FitVision Logo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3.5">
          {/* Official Metallic 3D Logo Image */}
          <div className="relative group flex-shrink-0">
            <img
              src="/fitvision-logo.png"
              alt="FitVision 3D Logo"
              className="w-12 h-12 object-contain rounded-2xl shadow-xl shadow-blue-500/25 ring-1 ring-white/10 group-hover:scale-105 transition-transform"
            />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-extrabold text-xl tracking-tight text-white">
                Social Trust & AI Review Authenticity Guard
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-500/40 text-[11px] font-mono text-blue-300 font-bold">
                FitVision Guard Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified reviews with friends circle trust ("Rahul bought this") & automated fake/paid review detection.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsWriteModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-blue-500/30 transition-all active:scale-95 self-start md:self-auto"
        >
          <MessageSquare className="w-4 h-4" />
          Submit a Review
        </button>
      </div>

      {/* Social Trust Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Friends Circle Trust Card */}
        <div className="bg-gradient-to-br from-emerald-950/50 via-slate-950 to-slate-950 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Friends Circle Trust
            </span>
            <span className="text-xs font-mono font-bold text-emerald-300">
              {friendCount} Friends
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>Rahul, Ananya & Vikram</strong> in your personal contact network bought this item and rated it 5★!
          </p>
        </div>

        {/* AI & Paid Review Guard Card */}
        <div className="bg-gradient-to-br from-blue-950/50 via-slate-950 to-slate-950 border border-blue-500/30 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Authenticity Meter
            </span>
            <span className="text-xs font-mono font-bold text-blue-300">96.8% Organic</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            FitVision NLP AI actively flags synthetic bot reviews and disclosed paid promo reviews automatically.
          </p>
        </div>

        {/* Rating Summary Card */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-white flex items-center gap-1.5">
              4.9 <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-xs text-slate-400">Verified Buyer Rating</div>
          </div>
          <div className="text-right text-[11px] font-mono text-amber-300/90">
            <div>100% Fit Match</div>
            <div className="text-slate-400">98% Recommendation</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All ({reviewsList.length})
          </button>

          <button
            onClick={() => setActiveFilter('friends')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'friends'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            <span>Friends ({friendCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('verified')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'verified'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span>Verified Buyers</span>
          </button>

          <button
            onClick={() => setActiveFilter('paid')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'paid'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-300" />
            <span>Flagged Paid ({paidCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('ai')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'ai'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-red-300" />
            <span>Flagged AI ({aiCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-48">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            No reviews matching selected filter.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className={`p-5 rounded-2xl border transition-all space-y-3 ${
                rev.isFriend
                  ? 'bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                  : rev.isPaidFlagged
                  ? 'bg-gradient-to-r from-slate-900 via-amber-950/25 to-slate-900 border-amber-500/40'
                  : rev.isAiFlagged
                  ? 'bg-gradient-to-r from-slate-900 via-red-950/25 to-slate-900 border-red-500/40'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {rev.avatarUrl ? (
                    <img
                      src={rev.avatarUrl}
                      alt={rev.author}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-sm">
                      {rev.author.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">{rev.author}</span>

                      {/* FRIEND BADGE */}
                      {rev.isFriend && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-[11px] font-semibold text-emerald-300 shadow-sm shadow-emerald-500/20">
                          <Users className="w-3 h-3 text-emerald-400" />
                          Verified Friend Purchase
                        </span>
                      )}

                      {/* ORGANIC BUYER */}
                      {rev.isVerifiedBuyer && !rev.isFriend && !rev.isAiFlagged && !rev.isPaidFlagged && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-[10px] font-medium text-blue-300">
                          <CheckCircle className="w-3 h-3 text-blue-400" />
                          Verified Buyer
                        </span>
                      )}

                      {/* FLAGGED PAID */}
                      {rev.isPaidFlagged && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-500/60 text-[11px] font-bold text-amber-300">
                          <DollarSign className="w-3 h-3 text-amber-400" />
                          Flagged: Paid Promo / Sponsored
                        </span>
                      )}

                      {/* FLAGGED AI */}
                      {rev.isAiFlagged && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-950 border border-red-500/60 text-[11px] font-bold text-red-300">
                          <Bot className="w-3 h-3 text-red-400" />
                          Flagged: AI-Generated / Bot
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {rev.fitPurchased} • {rev.date}
                    </div>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <p className="text-xs md:text-sm text-slate-200 leading-relaxed pl-1">
                "{rev.content}"
              </p>

              {/* AI Guard Analysis Reason Box */}
              {rev.aiReason && (
                <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{rev.aiReason}</span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => {
                    setReviewsList((prev) =>
                      prev.map((r) => (r.id === rev.id ? { ...r, likes: r.likes + 1 } : r))
                    );
                  }}
                  className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({rev.likes})
                </button>

                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span className={rev.aiDetectionScore > 80 ? 'text-emerald-400' : 'text-amber-400'}>
                    FitVision Authenticity: {rev.aiDetectionScore}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Interactive Write Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <img src="/fitvision-logo.png" alt="FitVision Logo" className="w-8 h-8 object-contain rounded-lg" />
                <h4 className="font-extrabold text-base text-white">Submit a Product Review</h4>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Review Disclosure Type Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Review Disclosure & Type
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedType('organic')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      selectedType === 'organic'
                        ? 'bg-blue-950/60 border-blue-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Genuine Organic Order
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedType('paid')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      selectedType === 'paid'
                        ? 'bg-amber-950/60 border-amber-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Paid / Sponsored Promo
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedType('free_product')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      selectedType === 'free_product'
                        ? 'bg-purple-950/60 border-purple-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5 text-purple-400" /> Received Free Product
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedType('ai_generated')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      selectedType === 'ai_generated'
                        ? 'bg-red-950/60 border-red-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 text-red-400" /> AI-Assisted Writing
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 text-amber-400"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">Review Text</label>
                  <span className={`text-[11px] font-mono font-bold ${currentAnalysis.color}`}>
                    {currentAnalysis.label}
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Share your honest experience with fit, comfort, and fabric..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                  required
                />
              </div>

              {/* Real-time AI Authenticity Meter */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  FitVision Live Authenticity Meter
                </span>
                <span className={`font-mono font-extrabold ${currentAnalysis.color}`}>
                  {currentAnalysis.score}% Score
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
