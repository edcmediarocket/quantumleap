
// src/hooks/useFeatureToggles.ts
"use client";

import { useState, useEffect } from 'react';
import { getFirestore, doc, Firestore, onSnapshot } from 'firebase/firestore'; // Added onSnapshot
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
  } catch (error) {
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
    
    // Set initial loading state
    setLoadingToggles(true);
    setErrorToggles(null);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const firestoreData = docSnap.data() as Partial<FeatureToggles>;
        setToggles(prev => ({ ...defaultFeatureTogglesState, ...prev, ...firestoreData }));
      } else {
        setToggles(defaultFeatureTogglesState);
        console.warn("Feature toggles document not found in Firestore. Using default settings. Admin page should create this document.");
        // Optionally, you could try to create the document here with defaults if it's critical
        // import { setDoc } from 'firebase/firestore';
        // setDoc(docRef, defaultFeatureTogglesState).catch(err => console.error("Failed to create default toggles", err));
      }
      setLoadingToggles(false); // Set loading to false after first successful snapshot or if doc doesn't exist
    }, (error) => {
      console.error("Error listening to feature toggles:", error);
      setErrorToggles(error instanceof Error ? error.message : "Failed to load feature toggles in real-time.");
      setToggles(defaultFeatureTogglesState); // Fallback to defaults on error
      setLoadingToggles(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount

  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  return { toggles, loadingToggles, errorToggles };
}
