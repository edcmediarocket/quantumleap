// src/components/app/header.tsx
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Waves, Info, LogIn, UserPlus, LogOut, UserCircle, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, Auth, User } from 'firebase/auth';
import { firebaseConfig } from '@/lib/firebaseConfig';
import { LoadingDots } from '../ui/loading-dots'; 
import { cn } from "@/lib/utils";
import type { ActiveTabType } from '@/app/page';

let app: FirebaseApp;
let auth: Auth;

const ADMIN_UID = 'qRJOtYXWqLbpQ1yx6qRdwSGwGyl1';

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    // console.error("Firebase initialization error in AppHeader:", error); 
  }
} else {
  app = getApps()[0];
}

if (app! && !auth) { 
  try {
    auth = getAuth(app);
  } catch (error) {
    // console.error("Error initializing Firebase Auth in AppHeader:", error);
  }
}

interface AppHeaderProps {
  activeTab: ActiveTabType;
}

export function AppHeader({ activeTab }: AppHeaderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    }, (error) => { 
        setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (!auth) {
      toast({ title: "Error", description: "Authentication service unavailable.", variant: "destructive" });
      return;
    }
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error) {
      toast({ title: "Sign Out Error", description: "Failed to sign out. Please try again.", variant: "destructive" });
    }
  };

  const isAdmin = currentUser?.uid === ADMIN_UID;

  const disclaimerTitleColor = 
    activeTab === 'profitGoal' ? 'text-accent' :
    activeTab === 'memeFlip' ? 'text-[hsl(var(--orange-hsl))]' :
    'text-primary';

  const disclaimerIconColor = 
    activeTab === 'profitGoal' ? 'text-accent' :
    activeTab === 'memeFlip' ? 'text-[hsl(var(--orange-hsl))]' :
    'text-primary';
  
  const disclaimerBorderColor =
    activeTab === 'profitGoal' ? 'border-accent/30' :
    activeTab === 'memeFlip' ? 'border-[hsl(var(--orange-hsl))]/30' :
    'border-primary/30';

  return (
    <>
      <div className="flex justify-end items-center gap-2 py-3 mb-3"> 
        {loadingAuth ? (
          <Button variant="ghost" size="sm" disabled className="w-24"> {/* Added fixed width for loading state */}
            <LoadingDots size="sm"/>
          </Button>
        ) : currentUser ? (
          <>
            <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1">
              <UserCircle className="h-4 w-4" />
              {currentUser.email || 'Signed In'}
            </span>
            {isAdmin && (
              <Button variant="outline" size="sm" asChild className="text-primary border-primary hover:bg-primary/10 hover:text-primary">
                <Link href="/admin">
                  <Settings className="mr-1 h-4 w-4" /> Admin
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut} className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="mr-1 h-4 w-4" />
              Sign Out
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:bg-primary/10 hover:text-primary">
              <Link href="/signin">
                <LogIn className="mr-1 h-4 w-4" /> Sign In
              </Link>
            </Button>
            <Button variant="default" size="sm" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/signup">
                <UserPlus className="mr-1 h-4 w-4" /> Sign Up
              </Link>
            </Button>
          </>
        )}
      </div>

      <div className="text-center"> 
        <div className="inline-flex items-center gap-3">
          <Waves className="h-10 w-10 md:h-12 md:w-12 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Quantum Leap
            </span>
          </h1>
        </div>
        <p className="mt-2 text-md md:text-lg text-muted-foreground">
          AI-Powered Crypto Insights for Quick Profits
        </p>
      </div>
      
      <Alert variant="default" className={cn("mt-6 max-w-2xl mx-auto text-sm bg-card/30 text-left", disclaimerBorderColor)}>
        <Info className={cn("h-5 w-5", disclaimerIconColor)} />
        <AlertTitle className={cn(disclaimerTitleColor, "opacity-90")}>Important Disclaimer</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          The information provided by Quantum Leap is generated by an AI and is for informational purposes only. It should not be considered financial advice. Cryptocurrency investments are highly volatile and carry significant risk. Past performance is not indicative of future results. Always do your own research (DYOR) and consult with a qualified financial advisor before making any investment decisions. We cannot guarantee the accuracy or completeness of the AI's predictions.
        </AlertDescription>
      </Alert>
    </>
  );
}
