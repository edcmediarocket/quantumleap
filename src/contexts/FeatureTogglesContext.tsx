
// src/contexts/FeatureTogglesContext.tsx
"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useFeatureToggles } from '@/hooks/useFeatureToggles';
import type { FeatureToggles } from '@/app/admin/page'; 
import { LoadingDots } from '@/components/ui/loading-dots';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

interface FeatureTogglesContextType {
  toggles: FeatureToggles;
  loadingToggles: boolean;
  errorToggles: string | null;
}


const defaultContextValue: FeatureTogglesContextType = {
  toggles: {
    darkMode: true,
    testUserMode: false,
    aiCoinPicksEnabled: true,
    profitGoalEnabled: true,
    memeCoinHunterEnabled: true,
    predictiveAlertsEnabled: true,
    aiCoachEnabled: true,
    dailySignalsPanelEnabled: true, 
    aiCoachChatboxEnabled: true, // New toggle default
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


  return (
    <FeatureTogglesContext.Provider value={{ toggles, loadingToggles, errorToggles }}>
      {children}
    </FeatureTogglesContext.Provider>
  );
};

    