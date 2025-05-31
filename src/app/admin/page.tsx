
// src/app/admin/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { getAuth, Auth, User } from 'firebase/auth';
import Toggle from '@/components/app/admin/Toggle';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebaseConfig';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Settings, ArrowLeftCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error during initial setup:", error);
  }
} else {
  app = getApps()[0];
}

if (app! && !auth) { 
  try {
    auth = getAuth(app);
    if (!db) db = getFirestore(app);
  } catch (error) {
    console.error("Error initializing Firestore/Auth:", error);
  }
}

// Admin UID: qRJOtYXWqLbpQ1yx6qRdwSGwGyl1 (Associated with coreyenglish517@gmail.com)
const ADMIN_UID = 'qRJOtYXWqLbpQ1yx6qRdwSGwGyl1';

export interface FeatureToggles {
  darkMode: boolean;
  testUserMode: boolean;
  aiCoinPicksEnabled: boolean;
  profitGoalEnabled: boolean;
  memeCoinHunterEnabled: boolean;
  predictiveAlertsEnabled: boolean;
  aiCoachEnabled: boolean;
}

const initialFeatureTogglesState: FeatureToggles = {
  darkMode: true,
  testUserMode: false,
  aiCoinPicksEnabled: true,
  profitGoalEnabled: true,
  memeCoinHunterEnabled: true,
  predictiveAlertsEnabled: true,
  aiCoachEnabled: true,
};

const AdminDashboard = () => {
  const [featureToggles, setFeatureToggles] = useState<FeatureToggles>(initialFeatureTogglesState);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
        console.warn("Firebase Auth is not initialized yet for AdminDashboard effect. Attempting re-init.");
        if (getApps().length && !auth) {
            try {
              auth = getAuth(getApps()[0]);
              if (!db && app) db = getFirestore(app);
            } catch (e) {
                console.error("Delayed auth/db init error:", e);
                setLoading(false);
                toast({ title: "Error", description: "Firebase services not fully available.", variant: "destructive" });
                return;
            }
        } else if (!getApps().length) {
            setLoading(false);
            toast({ title: "Error", description: "Firebase not initialized.", variant: "destructive" });
            return;
        }
         if (!auth) {
            setLoading(false);
            toast({ title: "Critical Error", description: "Firebase Auth could not be initialized.", variant: "destructive" });
            return;
        }
    }

    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user && user.uid === ADMIN_UID) {
        fetchToggles(user);
      } else {
        setLoading(false); 
      }
    });
    return () => unsubscribe();
  }, [toast]);

  const fetchToggles = async (user: User) => {
    if (!user || user.uid !== ADMIN_UID || !db) {
        toast({ title: "Access Issue", description: "Admin user not verified or DB unavailable for fetching toggles.", variant: "warning" });
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const docRef = doc(db, 'adminSettings', 'featureToggles');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const firestoreData = docSnap.data() || {};
        setFeatureToggles({
          ...initialFeatureTogglesState,
          ...(firestoreData as Partial<FeatureToggles>), 
        });
      } else {
        await setDoc(docRef, initialFeatureTogglesState);
        setFeatureToggles(initialFeatureTogglesState); 
        toast({ title: "Admin Setup", description: "Initial feature toggles set in Firestore."});
      }
    } catch (error) {
        console.error("Error fetching toggles:", error);
        toast({ title: "Error", description: `Failed to fetch toggles: ${error instanceof Error ? error.message : "Unknown error"}`, variant: "destructive"});
        setFeatureToggles(initialFeatureTogglesState);
    } finally {
        setLoading(false);
    }
  };

  const updateToggle = async (key: keyof FeatureToggles, value: boolean) => {
    if (!db) {
        toast({ title: "Error", description: "Firestore not available for updating toggle.", variant: "destructive" });
        return;
    }
    const newToggles = { ...featureToggles, [key]: value };
    setFeatureToggles(newToggles);
    
    try {
      await setDoc(doc(db, 'adminSettings', 'featureToggles'), newToggles, { merge: true });
      toast({ title: "Success", description: `${key.replace(/([A-Z])/g, ' $1').trim()} updated to ${value ? 'ON' : 'OFF'}. Changes are live.` });
    } catch (error) {
        console.error("Error updating toggle:", error);
        toast({ title: "Error", description: `Failed to update ${key}: ${error instanceof Error ? error.message : "Unknown error"}`, variant: "destructive"});
        // Revert UI on error
        setFeatureToggles(prev => ({ ...prev, [key]: !value }));
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-lg text-primary">Loading Admin Dashboard...</p>
    </div>
  );

  if (!currentUser) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background text-center p-4">
        <ShieldCheck className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You must be signed in as an administrator to view this page.</p>
        <Button asChild variant="destructive">
          <Link href="/signin">Sign In to Access Admin</Link>
        </Button>
         <p className="text-xs text-muted-foreground mt-4">
            (Admin UID: {ADMIN_UID})
        </p>
    </div>
  );
  
  if (currentUser.uid !== ADMIN_UID) return (
     <div className="flex flex-col justify-center items-center min-h-screen bg-background text-center p-4">
        <ShieldCheck className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <p className="text-xs text-muted-foreground mt-1">Logged in as: {currentUser.email || currentUser.uid}</p>
         <p className="text-xs text-muted-foreground mt-4">
            (Ensure you are using the admin account associated with UID: {ADMIN_UID})
        </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-primary flex items-center justify-center gap-3">
                <Settings className="w-10 h-10" />
                Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage Quantum Leap Features (Changes save automatically & update live)</p>
        </header>
        <div className="max-w-2xl mx-auto mt-10 p-6 md:p-8 rounded-xl glass-effect shadow-2xl">
        <h2 className="text-2xl font-semibold mb-6 text-primary-foreground border-b border-border/50 pb-3">Feature Toggles</h2>
        <div className="space-y-2">
            {(Object.keys(featureToggles) as Array<keyof FeatureToggles>).map((key) => (
            <Toggle
                key={key}
                label={key}
                enabled={featureToggles[key]}
                onToggle={() => updateToggle(key, !featureToggles[key])}
            />
            ))}
        </div>
         <div className="mt-8 pt-6 border-t border-border/30">
            <Button asChild variant="outline" className="w-full text-primary border-primary hover:bg-primary/10 hover:text-primary">
              <Link href="/">
                <ArrowLeftCircle className="mr-2 h-5 w-5" />
                Back to Homepage (Changes are auto-saved)
              </Link>
            </Button>
          </div>
        </div>
         <footer className="mt-12 text-center text-xs text-muted-foreground/70">
            <p>Admin Panel &copy; {new Date().getFullYear()} Quantum Leap</p>
        </footer>
    </div>
  );
};

export default AdminDashboard;
