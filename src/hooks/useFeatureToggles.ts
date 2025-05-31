
// src/hooks/useFeatureToggles.ts
"use client";

import { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, Firestore } from 'firebase/firestore';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebaseConfig';
import type { FeatureToggles } from '@/app/admin/page'; // Import the interface

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

// Default state for feature toggles, mirrors the one in admin/page.tsx
// This is used as a fallback if Firestore data is unavailable or not yet loaded.
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
      setErrorToggles("Firestore is not initialized. Feature toggles cannot be loaded.");
      setLoadingToggles(false);
      setToggles(defaultFeatureTogglesState); // Fallback to defaults
      return;
    }

    const fetchTogglesFromFirestore = async () => {
      setLoadingToggles(true);
      setErrorToggles(null);
      try {
        const docRef = doc(db, 'adminSettings', 'featureToggles');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const firestoreData = docSnap.data() as Partial<FeatureToggles>;
          // Merge with defaults to ensure all keys are present
          setToggles(prev => ({ ...defaultFeatureTogglesState, ...prev, ...firestoreData }));
        } else {
          // If no settings in Firestore, use defaults. Admin page handles creation.
          setToggles(defaultFeatureTogglesState);
          console.warn("Feature toggles document not found in Firestore. Using default settings.");
        }
      } catch (error) {
        console.error("Error fetching feature toggles:", error);
        setErrorToggles(error instanceof Error ? error.message : "Failed to load feature toggles.");
        setToggles(defaultFeatureTogglesState); // Fallback to defaults on error
      } finally {
        setLoadingToggles(false);
      }
    };

    fetchTogglesFromFirestore();

    // Note: Real-time listener (onSnapshot) could be used here if toggles need to update live
    // without a page refresh, but for admin-controlled toggles, fetching once is often sufficient.
    // const unsubscribe = onSnapshot(doc(db, 'adminSettings', 'featureToggles'), (docSnap) => { ... });
    // return () => unsubscribe?.();

  }, []);

  return { toggles, loadingToggles, errorToggles };
}

    