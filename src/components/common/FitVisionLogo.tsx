'use client';

/**
 * Clean Minimalist 2D Vector Logo Component for FitVision
 * Lightweight, high-tech, fast-loading, zero 3D distortion.
 */

import React, { useState } from 'react';

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
    sm: { box: 'w-7 h-7', text: 'text-sm' },
    md: { box: 'w-9 h-9', text: 'text-base font-extrabold' },
    lg: { box: 'w-12 h-12', text: 'text-2xl font-black' },
    xl: { box: 'w-14 h-14', text: 'text-3xl font-black' },
  }[size];

  // Pure 2D Minimalist Vector SVG Logo Mark
  const renderMinimalistSvg = () => (
    <div
      className={`rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm ring-1 ring-blue-500/20 group-hover:scale-105 transition-all duration-200 ${sizeStyles.box} ${className}`}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1.5"
      >
        <path
          d="M10 10H28V14H16V18H25V22H16V30H10V10Z"
          fill="white"
        />
        <path
          d="M21 14L26 30H30L35 14H30L28 22L26 14H21Z"
          fill="#93C5FD"
        />
        <circle cx="30" cy="10" r="2.5" fill="#38BDF8" />
      </svg>
    </div>
  );

  return (
    <div className="inline-flex items-center gap-2.5 select-none group">
      {!imageError ? (
        <img
          src="/logo.svg"
          alt="FitVision 2D Logo"
          onError={() => setImageError(true)}
          className={`object-contain transition-transform duration-200 ${sizeStyles.box} ${className}`}
        />
      ) : (
        renderMinimalistSvg()
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
