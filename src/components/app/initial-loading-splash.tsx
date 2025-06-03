// src/components/app/initial-loading-splash.tsx
"use client";

import React from 'react';
import Image from 'next/image';

export function InitialLoadingSplash() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center text-center text-white"
      style={{
        // Ensure you have /assets/bg-stars.gif in your public folder or replace this URL
        backgroundImage: "url('https://placehold.co/1920x1080.gif/000000/FFFFFF?text=Loading+Background')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      data-ai-hint="starry sky background" // For the div's background
    >
      <Image
        // Ensure you have /assets/logo-splash.png in your public folder or replace this URL
        src="https://placehold.co/250x250/1a1a1a/FFFFFF.png?text=QL+Logo"
        alt="Quantum Leap Loading"
        data-ai-hint="futuristic app logo"
        width={250}
        height={250} 
        className="mb-5 animate-pulse-logo"
        priority // Important for LCP
      />
      <p className="text-2xl font-semibold" style={{ textShadow: '0 0 10px hsl(var(--primary))' }}>
        Initializing Quantum Leap...
      </p>
      {/* Define animation locally or move to globals.css if preferred */}
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
