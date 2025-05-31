
// src/app/admin/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { getAuth, Auth, User } from 'firebase/auth';
import Toggle from '@/components/app/admin/Toggle'; // Updated import path
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'; // Import getApps
import { firebaseConfig } from '@/lib/firebaseConfig'; // Import the centralized config
import { Button } from '@/components/ui/button'; // For potential sign-in/out button
import { ShieldCheck, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

// Ensure Firebase is initialized only once
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error during initial setup:", error);
    // Fallback or error display might be needed in a real app
  }
} else {
  app = getApps()[0]; // Use existing app
}

// Initialize services if app is available
if (app!) {
  try {
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Error initializing Firestore/Auth:", error);
    // Handle cases where services might fail to initialize
  }
}


const ADMIN_UID = 'qRJOtYXWqLbpQ1yx6qRdwSGwGyl1';

interface FeatureToggles {
  darkMode: boolean;
  testUserMode: boolean;
  aiCoachLive: boolean;
  whaleAlertsActive: boolean; 
  predictiveAlertsActive: boolean; 
  profitGoalCalculator: boolean;
  memeCoinFinder: boolean;
  // Add more feature toggles here as needed
}

const AdminDashboard = () => {
  const [featureToggles, setFeatureToggles] = useState<FeatureToggles>({
    darkMode: true, // Default for the app
    testUserMode: false,
    aiCoachLive: true,
    whaleAlertsActive: true,
    predictiveAlertsActive: true,
    profitGoalCalculator: true,
    memeCoinFinder: true,
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
        console.warn("Firebase Auth is not initialized yet for AdminDashboard effect.");
        // Attempt to re-initialize if needed, or wait.
        // For this prototype, we'll let it proceed, but this indicates an init order issue if it happens.
        if (getApps().length && !auth) {
            try {
              auth = getAuth(getApps()[0]);
              if (!db) db = getFirestore(getApps()[0]);
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
  }, [toast]); // Added toast to dependency array as it's used in the effect

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
        setFeatureToggles(prev => ({...prev, ...docSnap.data() as FeatureToggles}));
      } else {
        await setDoc(docRef, featureToggles); // Initialize with current defaults if not present
        toast({ title: "Admin Setup", description: "Initial feature toggles set in Firestore."});
      }
    } catch (error) {
        console.error("Error fetching toggles:", error);
        toast({ title: "Error", description: `Failed to fetch toggles: ${error instanceof Error ? error.message : "Unknown error"}`, variant: "destructive"});
    } finally {
        setLoading(false);
    }
  };

  const updateToggle = async (key: keyof FeatureToggles, value: boolean) => {
    if (!db) {
        toast({ title: "Error", description: "Firestore not available for updating toggle.", variant: "destructive" });
        return;
    }
    const updatedToggles = { ...featureToggles, [key]: value };
    setFeatureToggles(updatedToggles); // Optimistic update
    try {
      await setDoc(doc(db, 'adminSettings', 'featureToggles'), updatedToggles, { merge: true }); // Use merge:true to avoid overwriting unrelated fields if any
      toast({ title: "Success", description: `${key.replace(/([A-Z])/g, ' $1').trim()} updated to ${value ? 'ON' : 'OFF'}.` });
    } catch (error) {
        console.error("Error updating toggle:", error);
        toast({ title: "Error", description: `Failed to update ${key}: ${error instanceof Error ? error.message : "Unknown error"}`, variant: "destructive"});
        // Revert optimistic update on error
        setFeatureToggles(prev => ({...prev, [key]: !value }));
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
        <Button onClick={() => toast({ title: "Action Required", description: "Please implement a Firebase Sign-In flow."})} variant="destructive">
            Sign In as Admin (Placeholder)
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
            (Ensure you are using the admin account: {ADMIN_UID})
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
            <p className="text-muted-foreground mt-1">Manage Quantum Leap Features</p>
        </header>
        <div className="max-w-2xl mx-auto mt-10 p-6 md:p-8 rounded-xl glass-effect shadow-2xl">
        <h2 className="text-2xl font-semibold mb-6 text-primary-foreground border-b border-border/50 pb-3">Feature Toggles</h2>
        <div className="space-y-2">
            {Object.keys(featureToggles).map((key) => (
            <Toggle
                key={key}
                label={key}
                enabled={featureToggles[key as keyof FeatureToggles]}
                onToggle={() => updateToggle(key as keyof FeatureToggles, !featureToggles[key as keyof FeatureToggles])}
            />
            ))}
        </div>
        </div>
         <footer className="mt-12 text-center text-xs text-muted-foreground/70">
            <p>Admin Panel &copy; {new Date().getFullYear()} Quantum Leap</p>
        </footer>
    </div>
  );
};

export default AdminDashboard;
