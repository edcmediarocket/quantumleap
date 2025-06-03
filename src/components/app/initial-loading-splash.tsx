
// src/components/app/initial-loading-splash.tsx
"use client";

import React from 'react';
import Image from 'next/image';

export function InitialLoadingSplash() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center text-center text-white"
      style={{
        // Ensure you have /public/assets/bg-stars.gif (or your equivalent background)
        backgroundImage: "url('/assets/bg-stars.gif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      data-ai-hint="starry sky background"
    >
      {/* Ensure you have /public/assets/logo-splash.png (or your equivalent logo) */}
      <Image
        src="/assets/logo-splash.png" 
        alt="Quantum Leap Loading"
        data-ai-hint="futuristic app logo"
        width={250}
        height={250} 
        className="mb-5 animate-pulse-logo"
        priority 
      />
      <p className="text-2xl font-semibold" style={{ textShadow: '0 0 10px hsl(var(--primary))' }}>
        Initializing Quantum Leap...
      </p>
      <style jsx global>{`
        @keyframes pulse-logo {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .animate-pulse-logo {
          animation: pulse-logo 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
