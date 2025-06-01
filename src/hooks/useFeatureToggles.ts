
// src/hooks/useFeatureToggles.ts
"use client";

import { useState, useEffect } from 'react';
import { getFirestore, doc, Firestore, onSnapshot } from 'firebase/firestore'; 
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebaseConfig';
import type { FeatureToggles } from '@/app/admin/page';

let app: FirebaseApp;
let db: Firestore;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error in useFeatureToggles:", error);
  }
} else {
  app = getApps()[0];
}

if (app! && !db) {
  try {
    db = getFirestore(app);
  } catch (error) { // Added missing opening curly brace here
    console.error("Error initializing Firestore in useFeatureToggles:", error);
  }
}

const defaultFeatureTogglesState: FeatureToggles = {
  darkMode: true,
  testUserMode: false,
  aiCoinPicksEnabled: true,
  profitGoalEnabled: true,
  memeCoinHunterEnabled: true,
  predictiveAlertsEnabled: true,
  aiCoachEnabled: true,
  dailySignalsPanelEnabled: true, 
  aiCoachChatboxEnabled: true, // New toggle default
};

export function useFeatureToggles() {
  const [toggles, setToggles] = useState<FeatureToggles>(defaultFeatureTogglesState);
  const [loadingToggles, setLoadingToggles] = useState(true);
  const [errorToggles, setErrorToggles] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setErrorToggles("Firestore is not initialized. Feature toggles cannot be loaded in real-time.");
      setLoadingToggles(false);
      setToggles(defaultFeatureTogglesState);
      return;
    }

    const docRef = doc(db, 'adminSettings', 'featureToggles');
    
    setLoadingToggles(true);
    setErrorToggles(null);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const firestoreData = docSnap.data() as Partial<FeatureToggles>;
        setToggles(prev => ({ ...defaultFeatureTogglesState, ...prev, ...firestoreData }));
      } else {
        setToggles(defaultFeatureTogglesState);
        console.warn("Feature toggles document not found in Firestore. Using default settings. Admin page should create this document.");
      }
      setLoadingToggles(false); 
    }, (error) => {
      console.error("Error listening to feature toggles:", error);
      setErrorToggles(error instanceof Error ? error.message : "Failed to load feature toggles in real-time.");
      setToggles(defaultFeatureTogglesState); 
      setLoadingToggles(false);
    });

    return () => unsubscribe(); 

  }, []); 

  return { toggles, loadingToggles, errorToggles };
}

    