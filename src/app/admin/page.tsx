
// src/app/admin/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { getFirestore, doc, getDoc, setDoc, Firestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getAuth, Auth, User } from 'firebase/auth';
import Toggle from '@/components/app/admin/Toggle';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebaseConfig';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Settings, ArrowLeftCircle, Brain, RefreshCw, AlertTriangle, ListChecks, MessageSquare } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingDots } from '@/components/ui/loading-dots';

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

const ADMIN_UID = 'qRJOtYXWqLbpQ1yx6qRdwSGwGyl1';

export interface FeatureToggles {
  darkMode: boolean;
  testUserMode: boolean;
  aiCoinPicksEnabled: boolean;
  profitGoalEnabled: boolean;
  memeCoinHunterEnabled: boolean;
  predictiveAlertsEnabled: boolean;
  aiCoachEnabled: boolean;
  dailySignalsPanelEnabled: boolean;
  aiCoachChatboxEnabled: boolean; // New toggle
}

const initialFeatureTogglesState: FeatureToggles = {
  darkMode: true,
  testUserMode: false,
  aiCoinPicksEnabled: true,
  profitGoalEnabled: true,
  memeCoinHunterEnabled: true,
  predictiveAlertsEnabled: true,
  aiCoachEnabled: true,
  dailySignalsPanelEnabled: true,
  aiCoachChatboxEnabled: true, // Default to true for now
};

interface CoachLog {
  id: string;
  userId: string;
  userPrompt: string;
  aiResult: string;
  timestamp: string;
}

const AdminDashboard = () => {
  const [featureToggles, setFeatureToggles] = useState<FeatureToggles>(initialFeatureTogglesState);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  const [coachLogs, setCoachLogs] = useState<CoachLog[]>([]);
  const [isLoadingCoachLogs, setIsLoadingCoachLogs] = useState(false);
  const [coachLogsError, setCoachLogsError] = useState<string | null>(null);

  const fetchToggles = useCallback(async (user: User) => {
    if (!user || user.uid !== ADMIN_UID || !db) {
        toast({ title: "Access Issue", description: "Admin user not verified or DB unavailable for fetching toggles.", variant: "warning" });
        return false; 
    }
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
      return true; 
    } catch (error) {
        console.error("Error fetching toggles:", error);
        toast({ title: "Error", description: `Failed to fetch toggles: ${error instanceof Error ? error.message : "Unknown error"}`, variant: "destructive"});
        setFeatureToggles(initialFeatureTogglesState);
        return false; 
    }
  }, [toast]);


  const fetchCoachLogs = useCallback(async () => {
    if (!db) {
      setCoachLogsError("Firestore not available for fetching coach logs.");
      return;
    }
    setIsLoadingCoachLogs(true);
    setCoachLogsError(null);
    try {
      const logsRef = collection(db, 'coachLogs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(25));
      const querySnapshot = await getDocs(q);
      const fetchedLogs: CoachLog[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<CoachLog, 'id'>)
      }));
      setCoachLogs(fetchedLogs);
    } catch (error) {
      console.error("Error fetching coach logs:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching logs.";
      setCoachLogsError(errorMessage);
      toast({ title: "Error Fetching Logs", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingCoachLogs(false);
    }
  }, [toast]);


  useEffect(() => {
    if (!auth) {
        console.warn("Firebase Auth is not initialized yet for AdminDashboard effect.");
        setLoading(false); 
        return;
    }

    const unsubscribe = auth.onAuthStateChanged(async user => {
      setCurrentUser(user);
      if (user && user.uid === ADMIN_UID) {
        setLoading(true); 
        const togglesSuccess = await fetchToggles(user);
        if (togglesSuccess) { 
          await fetchCoachLogs();
        }
        setLoading(false); 
      } else {
        setLoading(false); 
      }
    });
    return () => unsubscribe();
  }, [fetchToggles, fetchCoachLogs]);


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
        setFeatureToggles(prev => ({ ...prev, [key]: !value }));
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const formatTimestamp = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
      });
    } catch {
      return isoString; 
    }
  };


  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-background">
        <LoadingDots size="lg" />
        <p className="text-lg text-primary ml-3">Loading Admin Dashboard...</p>
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
            <p className="text-muted-foreground mt-1">Manage Quantum Leap Features & Monitor AI Coach</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Feature Toggles Card */}
          <Card className="lg:col-span-1 glass-effect default-glow-primary">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <ListChecks className="mr-3 h-7 w-7 text-primary" />
                Feature Toggles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.keys(featureToggles) as Array<keyof FeatureToggles>).map((key) => (
                <Toggle
                    key={key}
                    label={key}
                    enabled={featureToggles[key]}
                    onToggle={() => updateToggle(key, !featureToggles[key])}
                />
              ))}
            </CardContent>
          </Card>

          {/* AI Coach Interaction Logs Card */}
          <Card className="lg:col-span-2 glass-effect default-glow-accent">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <CardTitle className="flex items-center text-2xl mb-2 sm:mb-0">
                  <Brain className="mr-3 h-7 w-7 text-accent" />
                  AI Coach Interaction Logs
                </CardTitle>
                <Button variant="outline" size="sm" onClick={fetchCoachLogs} disabled={isLoadingCoachLogs} className="border-accent text-accent hover:bg-accent/10 hover:text-accent">
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingCoachLogs ? 'animate-spin' : ''}`} />
                  Refresh Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCoachLogs && <div className="flex justify-center py-6"><LoadingDots /></div>}
              {coachLogsError && (
                <div className="text-destructive p-4 bg-destructive/10 rounded-md flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5"/> {coachLogsError}
                </div>
              )}
              {!isLoadingCoachLogs && !coachLogsError && coachLogs.length === 0 && (
                <p className="text-muted-foreground text-center py-6">No coach interaction logs found.</p>
              )}
              {!isLoadingCoachLogs && !coachLogsError && coachLogs.length > 0 && (
                <div className="overflow-x-auto max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead className="w-[150px]">User ID</TableHead>
                        <TableHead>User Prompt</TableHead>
                        <TableHead>AI Result (Snippet)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coachLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">{formatTimestamp(log.timestamp)}</TableCell>
                          <TableCell className="text-xs truncate" title={log.userId}>{truncateText(log.userId, 15)}</TableCell>
                          <TableCell className="text-xs" title={log.userPrompt}>{truncateText(log.userPrompt, 70)}</TableCell>
                          <TableCell className="text-xs" title={log.aiResult}>{truncateText(log.aiResult, 70)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

         <div className="mt-8 pt-6 border-t border-border/30 text-center">
            <Button asChild variant="outline" className="text-primary border-primary hover:bg-primary/10 hover:text-primary">
              <Link href="/">
                <ArrowLeftCircle className="mr-2 h-5 w-5" />
                Back to Homepage
              </Link>
            </Button>
          </div>
        
         <footer className="mt-12 text-center text-xs text-muted-foreground/70">
            <p>©️ 2025 Designed By Corey Dean | All Rights Reserved</p>
        </footer>
    </div>
  );
};

export default AdminDashboard;

    