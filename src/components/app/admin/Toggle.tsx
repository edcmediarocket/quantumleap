
// src/components/app/admin/Toggle.tsx
"use client";

import React from 'react';

interface ToggleProps {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, enabled, onToggle }) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-b-0">
      <span className="capitalize text-sm text-foreground">{label.replace(/([A-Z])/g, ' $1').trim()}</span>
      <button
        onClick={onToggle}
        aria-pressed={enabled}
        className={`relative w-14 h-7 flex items-center rounded-full p-1 duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${enabled ? 'bg-primary' : 'bg-muted'}`}
      >
        <div
          className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out ${enabled ? 'translate-x-7' : 'translate-x-0'}`}
        ></div>
      </button>
    </div>
  );
};

export default Toggle;
