
// src/contexts/FeatureTogglesContext.tsx
"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useFeatureToggles } from '@/hooks/useFeatureToggles';
import type { FeatureToggles } from '@/app/admin/page'; // Import the interface
import { LoadingDots } from '@/components/ui/loading-dots';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

interface FeatureTogglesContextType {
  toggles: FeatureToggles;
  loadingToggles: boolean;
  errorToggles: string | null;
}

// Define a default context value that matches the FeatureToggles interface structure
// This helps with TypeScript type safety when consuming the context.
const defaultContextValue: FeatureTogglesContextType = {
  toggles: {
    darkMode: true,
    testUserMode: false,
    aiCoinPicksEnabled: true,
    profitGoalEnabled: true,
    memeCoinHunterEnabled: true,
    predictiveAlertsEnabled: true,
    aiCoachEnabled: true,
    dailySignalsPanelEnabled: true, // Added toggle
  },
  loadingToggles: true,
  errorToggles: null,
};

const FeatureTogglesContext = createContext<FeatureTogglesContextType>(defaultContextValue);

export const useFeatureTogglesContext = () => {
  const context = useContext(FeatureTogglesContext);
  if (context === undefined) {
    throw new Error('useFeatureTogglesContext must be used within a FeatureTogglesProvider');
  }
  return context;
};

interface FeatureTogglesProviderProps {
  children: ReactNode;
}

export const FeatureTogglesProvider = ({ children }: FeatureTogglesProviderProps) => {
  const { toggles, loadingToggles, errorToggles } = useFeatureToggles();

  // If there's an error loading toggles, we might want to show an error message
  // or a fallback UI instead of rendering children that depend on toggles.
  // For now, we'll pass the error state down.
  // A more robust app might halt rendering or show a global error.

  return (
    <FeatureTogglesContext.Provider value={{ toggles, loadingToggles, errorToggles }}>
      {children}
    </FeatureTogglesContext.Provider>
  );
};
