
// src/components/app/daily-signals-panel.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, limit, onSnapshot, Firestore, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebaseConfig';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingDots } from '@/components/ui/loading-dots';
import { Rss, Terminal, CalendarDays } from 'lucide-react';
import { GlassCardRoot } from './glass-card';
import { cn } from '@/lib/utils';
import type { ActiveTabType } from '@/app/page'; // Import ActiveTabType

let app: FirebaseApp;
let db: Firestore;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error in DailySignalsPanel:", error);
  }
} else {
  app = getApps()[0];
}

if (app! && !db) {
  try {
    db = getFirestore(app);
  } catch (error) {
    console.error("Error initializing Firestore in DailySignalsPanel:", error);
  }
}

interface Signal {
  id: string;
  strategy: string;
  createdAt: string; // ISO string
}

interface DailySignalsPanelProps {
  activeTab: ActiveTabType;
}

export function DailySignalsPanel({ activeTab }: DailySignalsPanelProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError("Firestore not available. Daily signals cannot be loaded.");
      setIsLoading(false);
      return;
    }

    const signalsRef = collection(db, 'dailySignals');
    const q = query(signalsRef, orderBy('createdAt', 'desc'), limit(5));

    const unsubscribe = onSnapshot(q, 
      (snapshot: QuerySnapshot<DocumentData>) => {
        const fetchedSignals: Signal[] = snapshot.docs.map(doc => ({
          id: doc.id,
          strategy: doc.data().strategy as string,
          createdAt: doc.data().createdAt as string,
        }));
        setSignals(fetchedSignals);
        setIsLoading(false);
        setError(null);
      }, 
      (err) => {
        console.error("Error fetching daily signals:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch daily signals.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const panelGlowClass = 
    activeTab === 'profitGoal' ? 'default-glow-accent' :
    activeTab === 'memeFlip' ? 'default-glow-orange' :
    'default-glow-primary';

  return (
    <section className="my-8">
      <GlassCardRoot className={cn(
          "glass-effect glass-effect-interactive-hover w-full max-w-3xl mx-auto p-6",
          panelGlowClass
        )}>
        <h2 className="text-2xl font-bold text-primary flex items-center mb-4">
          <Rss className="h-7 w-7 mr-3" />
          Latest Daily Signals
        </h2>

        {isLoading && <div className="flex justify-center py-4"><LoadingDots size="md" /></div>}

        {error && (
          <Alert variant="destructive" className="my-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Loading Signals</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && signals.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No daily signals available at the moment. Check back soon!
          </p>
        )}

        {!isLoading && !error && signals.length > 0 && (
          <div className="space-y-4">
            {signals.map((signal) => (
              <div key={signal.id} className="p-4 rounded-lg border border-border/30 bg-card/40 shadow-sm">
                <p className="text-sm text-foreground leading-relaxed">{signal.strategy}</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center">
                  <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                  {formatDate(signal.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
         <p className="text-xs text-muted-foreground/70 text-center mt-6">
            Signals are AI-generated and for informational purposes. DYOR.
        </p>
      </GlassCardRoot>
    </section>
  );
}

