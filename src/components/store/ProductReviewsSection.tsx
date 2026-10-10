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
} from 'lucide-react';

export interface ReviewItem {
  id: string;
  author: string;
  avatarUrl?: string;
  isFriend: boolean;
  friendName?: string;
  isVerifiedBuyer: boolean;
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

const SAMPLE_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    author: 'Rahul Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    isFriend: true,
    friendName: 'Rahul',
    isVerifiedBuyer: true,
    isAiFlagged: false,
    isPaidFlagged: false,
    aiDetectionScore: 100,
    rating: 5,
    date: '3 days ago',
    fitPurchased: 'Size M • Royal Blue',
    content:
      'Fabric drapes perfectly over the shoulders without any tight restriction. Size M fits spot-on based on the FitVision 3D camera recommendation!',
    likes: 12,
  },
  {
    id: 'rev-2',
    author: 'Ananya Roy',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    isFriend: true,
    friendName: 'Ananya',
    isVerifiedBuyer: true,
    isAiFlagged: false,
    isPaidFlagged: false,
    aiDetectionScore: 99,
    rating: 5,
    date: '1 week ago',
    fitPurchased: 'Size S • Royal Blue',
    content:
      'Color matches the live AR view exactly. The material feels premium heavy cotton and doesn’t shrink after wash.',
    likes: 8,
  },
  {
    id: 'rev-3',
    author: 'Vikram Malhotra',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80',
    isFriend: true,
    friendName: 'Vikram',
    isVerifiedBuyer: true,
    isAiFlagged: false,
    isPaidFlagged: false,
    aiDetectionScore: 97,
    rating: 4,
    date: '2 weeks ago',
    fitPurchased: 'Size L • Obsidian Black',
    content:
      'Really great fit around torso. Sleeve length is slightly long but looks intentional for an oversized streetwear look.',
    likes: 5,
  },
  {
    id: 'rev-4',
    author: 'Marcus Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    isFriend: false,
    isVerifiedBuyer: true,
    isAiFlagged: false,
    isPaidFlagged: false,
    aiDetectionScore: 95,
    rating: 4,
    date: '3 weeks ago',
    fitPurchased: 'Size M • Emerald Green',
    content:
      'Very crisp stitching and premium feel. Shipping was fast. Would buy another color.',
    likes: 3,
  },
  {
    id: 'rev-5',
    author: 'User_89231',
    isFriend: false,
    isVerifiedBuyer: false,
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
    isAiFlagged: false,
    isPaidFlagged: true,
    aiDetectionScore: 25,
    aiReason: 'Flagged: Incentivized/paid promo text pattern & repetitive spam URL signatures.',
    rating: 5,
    date: '4 days ago',
    fitPurchased: 'Size XL',
    content:
      'MUST BUY BEST SHIRT EVER 10/10! USE MY PROMO CODE DISCOUNT50 FOR 50% OFF ENTIRE STORE RIGHT NOW!',
    likes: 0,
  },
];

interface ProductReviewsSectionProps {
  productName?: string;
  productId?: string;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productName = 'Aura Minimalist Overshirt',
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'friends' | 'verified' | 'flagged'>('all');
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(SAMPLE_REVIEWS);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // New Review Form State
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newContent, setNewContent] = useState('');

  // Live AI Detector Calculation for new review
  const getLiveAiScore = (text: string): { score: number; label: string; color: string } => {
    if (!text || text.length < 10) return { score: 100, label: 'Type to analyze...', color: 'text-slate-400' };

    const lower = text.toLowerCase();
    const aiBuzzwords = [
      'revolutionary',
      'unparalleled',
      'synthesize',
      'masterpiece of apparel',
      'exceptional quality',
      'pristine aesthetic',
      'promo code',
      'discount50',
      'click my bio',
    ];

    let count = 0;
    aiBuzzwords.forEach((word) => {
      if (lower.includes(word)) count++;
    });

    if (count >= 2) {
      return { score: 18, label: '⚠️ High AI / Bot Phrasing Detected', color: 'text-amber-500' };
    } else if (count === 1) {
      return { score: 65, label: '⚡ Moderate Synthetic Phrasing', color: 'text-yellow-500' };
    }
    return { score: 98, label: '🟢 Authentic Human Writing Pattern', color: 'text-emerald-500' };
  };

  const currentAiStatus = getLiveAiScore(newContent);

  // Filtered Reviews
  const filteredReviews = reviewsList.filter((rev) => {
    if (activeFilter === 'friends') return rev.isFriend;
    if (activeFilter === 'verified') return rev.isVerifiedBuyer && !rev.isAiFlagged && !rev.isPaidFlagged;
    if (activeFilter === 'flagged') return rev.isAiFlagged || rev.isPaidFlagged;
    return true;
  });

  const friendReviewsCount = reviewsList.filter((r) => r.isFriend).length;
  const flaggedCount = reviewsList.filter((r) => r.isAiFlagged || r.isPaidFlagged).length;

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const isAi = currentAiStatus.score < 50;

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      author: newAuthor.trim() || 'Verified Shopper',
      isFriend: false,
      isVerifiedBuyer: true,
      isAiFlagged: isAi,
      isPaidFlagged: false,
      aiDetectionScore: currentAiStatus.score,
      aiReason: isAi ? 'Flagged: High synthetic phrasing detected by FitVision Guard' : undefined,
      rating: newRating,
      date: 'Just now',
      fitPurchased: 'Size M • Verified Purchase',
      content: newContent,
      likes: 0,
    };

    setReviewsList([newRev, ...reviewsList]);
    setNewContent('');
    setNewAuthor('');
    setIsWriteModalOpen(false);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-slate-100 shadow-2xl space-y-8">
      {/* Header Banner with FitVision Logo & Social Trust Shield */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {/* FitVision Official 3D Logo Badge */}
            <div className="relative group">
              <img
                src="/fitvision-logo.png"
                alt="FitVision Logo"
                className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform"
              />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg tracking-tight text-white">
                  Customer Reviews & Social Trust Guard
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-500/40 text-[10px] font-mono text-blue-300">
                  FitVision Guard AI Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verified reviews with social connection insights & fake/AI review detection.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsWriteModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all active:scale-95 self-start md:self-auto"
        >
          <MessageSquare className="w-4 h-4" />
          Write a Verified Review
        </button>
      </div>

      {/* Social Trust Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Social Connections Card */}
        <div className="bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/30 p-4 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Friends Circle Trust
            </span>
            <span className="text-xs font-mono font-bold text-emerald-300">
              {friendReviewsCount} Friends
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-snug">
            <strong>Rahul, Ananya & Vikram</strong> in your trusted network bought this item and left 5★ reviews!
          </p>
        </div>

        {/* AI Fake Review Shield Card */}
        <div className="bg-gradient-to-br from-blue-950/40 to-slate-950 border border-blue-500/30 p-4 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Authenticity Score
            </span>
            <span className="text-xs font-mono font-bold text-blue-300">96.4% Human</span>
          </div>
          <p className="text-xs text-slate-300 leading-snug">
            FitVision AI actively scans review syntax to filter out bot-generated & paid incentive reviews.
          </p>
        </div>

        {/* Average Rating Card */}
        <div className="bg-gradient-to-br from-amber-950/30 to-slate-950 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-white flex items-center gap-1.5">
              4.8 <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-xs text-slate-400">Based on verified purchases</div>
          </div>
          <div className="text-right text-[11px] font-mono text-amber-300/80">
            <div>100% Fit Accuracy</div>
            <div className="text-slate-400">Recommended by 98%</div>
          </div>
        </div>
      </div>

      {/* Review Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>All Reviews ({reviewsList.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('friends')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeFilter === 'friends'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-300" />
          <span>Friends & Social Circle ({friendReviewsCount})</span>
        </button>

        <button
          onClick={() => setActiveFilter('verified')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeFilter === 'verified'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
          <span>Verified Buyers Only</span>
        </button>

        <button
          onClick={() => setActiveFilter('flagged')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeFilter === 'flagged'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
          <span>Flagged AI / Bot Reviews ({flaggedCount})</span>
        </button>
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
                  : rev.isAiFlagged || rev.isPaidFlagged
                  ? 'bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/40 opacity-80'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              {/* Review Author & Badges */}
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
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{rev.author}</span>

                      {/* FRIEND BADGE */}
                      {rev.isFriend && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-[11px] font-semibold text-emerald-300 shadow-sm shadow-emerald-500/20">
                          <Users className="w-3 h-3 text-emerald-400" />
                          Verified Friend Purchase
                        </span>
                      )}

                      {/* VERIFIED BUYER */}
                      {rev.isVerifiedBuyer && !rev.isFriend && !rev.isAiFlagged && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-[10px] font-medium text-blue-300">
                          <CheckCircle className="w-3 h-3 text-blue-400" />
                          Verified Buyer
                        </span>
                      )}

                      {/* AI FLAGGED */}
                      {rev.isAiFlagged && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-500/60 text-[11px] font-bold text-amber-300">
                          <Bot className="w-3 h-3 text-amber-400" />
                          Flagged: Suspected AI Review
                        </span>
                      )}

                      {/* PAID FLAGGED */}
                      {rev.isPaidFlagged && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-950 border border-red-500/60 text-[11px] font-bold text-red-300">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          Flagged: Paid Promo / Spam
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {rev.fitPurchased} • {rev.date}
                    </div>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rev.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Review Content */}
              <p className="text-xs md:text-sm text-slate-200 leading-relaxed pl-1">
                "{rev.content}"
              </p>

              {/* AI Detection Insight Box */}
              {rev.aiReason && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
                  <Bot className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{rev.aiReason}</span>
                </div>
              )}

              {/* Footer Likes & Authenticity Metric */}
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
                    FitVision AI Authenticity: {rev.aiDetectionScore}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Write a Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <img src="/fitvision-logo.png" alt="Logo" className="w-7 h-7 object-contain rounded-lg" />
                <h4 className="font-bold text-base text-white">Write a Product Review</h4>
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
                  <label className="text-xs font-semibold text-slate-300">Review Message</label>
                  <span className={`text-[11px] font-mono font-semibold ${currentAiStatus.color}`}>
                    {currentAiStatus.label}
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Share your experience with fit, comfort, and fabric..."
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
                  Live AI Authenticity Check
                </span>
                <span className={`font-mono font-bold ${currentAiStatus.color}`}>
                  {currentAiStatus.score}% Human Score
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30"
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
