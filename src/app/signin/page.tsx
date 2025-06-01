
// src/app/signin/page.tsx
"use client";

import { SignInForm } from "@/components/app/auth/signin-form";
import { AppHeader } from "@/components/app/header"; // Optional: if you want the main header
import { Waves } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="container mx-auto min-h-screen px-4 py-8 flex flex-col items-center justify-center">
      {/* You can include a simpler header or the AppHeader here */}
      {/* <AppHeader /> */}
      <div className="text-center mb-12">
         <div className="inline-flex items-center gap-3 mb-2">
            <Waves className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Quantum Leap
            </span>
            </h1>
        </div>
        <p className="text-muted-foreground">Sign in to continue</p>
      </div>
      <SignInForm />
       <footer className="mt-12 py-4 text-center text-xs text-muted-foreground/70 border-t border-border/20 w-full max-w-md">
        <p>©️ 2025 Designed By Corey Dean | All Rights Reserved</p>
      </footer>
    </div>
  );
}
