'use client';

/**
 * Bulletproof FitVision Branding Logo Component with Strict Error Boundary Fallback
 * Guarantees zero broken image icons, browser placeholder squares, or alt text overflow.
 */

import React, { useState } from 'react';
import { Sparkles, Eye, Zap } from 'lucide-react';

interface FitVisionLogoProps {
  variant?: 'navbar' | 'hero' | 'review' | 'footer' | 'inline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export const FitVisionLogo: React.FC<FitVisionLogoProps> = ({
  variant = 'navbar',
  size = 'md',
  className = '',
  showText = false,
  textClassName = '',
}) => {
  const [imageError, setImageError] = useState(false);

  // Size dimensions mapping
  const sizeStyles = {
    sm: { img: 'w-7 h-7', icon: 'w-7 h-7', text: 'text-sm' },
    md: { img: 'w-9 h-9', icon: 'w-9 h-9', text: 'text-base font-extrabold' },
    lg: { img: 'w-12 h-12', icon: 'w-12 h-12', text: 'text-2xl font-black' },
    xl: { img: 'w-14 h-14', icon: 'w-14 h-14', text: 'text-3xl font-black' },
  }[size];

  // Render High-Tech Badge Fallback Component when image fails or returns 404
  const renderFallbackBadge = () => {
    if (variant === 'hero' || size === 'lg' || size === 'xl') {
      return (
        <div
          className={`w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shadow-inner backdrop-blur-md ${className}`}
        >
          <Eye className="w-6 h-6 text-blue-600" />
        </div>
      );
    }

    // Default Navbar / Compact Badge
    return (
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-sm ring-1 ring-blue-500/20 font-black text-xs tracking-tighter ${className}`}
      >
        <span>FV</span>
      </div>
    );
  };

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      {!imageError ? (
        <img
          src="/logo.png"
          alt="FitVision Logo"
          onError={() => setImageError(true)}
          className={`object-contain rounded-xl transition-all ${sizeStyles.img} ${className}`}
        />
      ) : (
        renderFallbackBadge()
      )}

      {showText && (
        <span className={`tracking-tight font-extrabold text-slate-900 ${sizeStyles.text} ${textClassName}`}>
          Fit<span className="text-blue-600">Vision</span>
        </span>
      )}
    </div>
  );
};

export default FitVisionLogo;
