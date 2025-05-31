
// src/app/admin/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { getAuth, Auth, User } from 'firebase/auth';
import Toggle from '@/components/app/admin/Toggle'; // Updated import path
import { initializeApp, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebaseConfig'; // Updated import path
import { Button } from '@/components/ui/button'; // For potential sign-in/out button
import { ShieldCheck, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (error) {
    console.error("Firebase initialization error:", error);
    // Handle cases where Firebase might already be initialized if this page re-renders,
    // or provide a fallback if initialization fails.
    // For this prototype, we'll log and let it proceed, but in prod, this needs robust handling.
}


// IMPORTANT: Replace with your actual Admin User's UID from Firebase Authentication
const ADMIN_UID = 'qRJOtYXWqLbpQ1yx6qRdwSGwGyl1';

interface FeatureToggles {
  darkMode: boolean;
  testUserMode: boolean;
  aiCoachLive: boolean;
  whaleAlertsActive: boolean; // Renamed for clarity
  predictiveAlertsActive: boolean; // Renamed for clarity
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
        console.error("Firebase Auth is not initialized.");
        setLoading(false);
        toast({ title: "Error", description: "Firebase Auth not available.", variant: "destructive" });
        return;
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
  }, []);

  const fetchToggles = async (user: User) => {
    if (!user || user.uid !== ADMIN_UID || !db) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const docRef = doc(db, 'adminSettings', 'featureToggles'); // Changed path for clarity
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFeatureToggles(prev => ({...prev, ...docSnap.data() as FeatureToggles}));
      } else {
        // If no toggles exist in Firestore, create them with current defaults
        await setDoc(docRef, featureToggles);
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
        toast({ title: "Error", description: "Firestore not available.", variant: "destructive" });
        return;
    }
    const updatedToggles = { ...featureToggles, [key]: value };
    setFeatureToggles(updatedToggles);
    try {
      await setDoc(doc(db, 'adminSettings', 'featureToggles'), updatedToggles);
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
        {/* Basic Sign-in placeholder -  Replace with your actual FirebaseUI or custom sign-in flow */}
        <Button onClick={() => alert("Implement Firebase Sign-In Flow Here")} variant="destructive">
            Sign In as Admin
        </Button>
         <p className="text-xs text-muted-foreground mt-4">
            (Ensure you are using the admin account: UID starting with {ADMIN_UID.substring(0, 5)}...)
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
            (Ensure you are using the admin account: UID starting with {ADMIN_UID.substring(0, 5)}...)
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
