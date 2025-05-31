
"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, Auth, AuthError } from 'firebase/auth';
import { firebaseConfig } from '@/lib/firebaseConfig';
import { LogIn, AlertTriangle } from 'lucide-react';
import { LoadingDots } from '@/components/ui/loading-dots';

let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error in signin-form:", error);
  }
} else {
  app = getApps()[0];
}

if (app! && !auth) {
  try {
    auth = getAuth(app);
  } catch (error) {
    console.error("Error initializing Firebase Auth in signin-form:", error);
  }
}

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type SignInFormValues = z.infer<typeof formSchema>;

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignInFormValues) => {
    setIsLoading(true);
    setError(null);

    if (!auth) {
      setError("Authentication service is not available. Please try again later.");
      setIsLoading(false);
      toast({
        title: "Authentication Error",
        description: "Could not connect to authentication service.",
        variant: "destructive",
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Sign In Successful",
        description: "Welcome back!",
      });
      // Redirect to home page or a dashboard page after successful sign-in
      // You might want to redirect to a specific page, e.g., router.push('/dashboard')
      // Or, if coming from admin, could redirect back using query params. For now, homepage.
      router.push('/'); 
    } catch (err) {
      const authError = err as AuthError;
      let friendlyMessage = "An unexpected error occurred. Please try again.";
      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          friendlyMessage = "Invalid email or password. Please check your credentials.";
          break;
        case 'auth/invalid-email':
          friendlyMessage = "The email address is not valid.";
          break;
        case 'auth/too-many-requests':
          friendlyMessage = "Too many failed login attempts. Please try again later or reset your password.";
          break;
        default:
          console.error("Firebase Sign-In Error:", authError);
      }
      setError(friendlyMessage);
      toast({
        title: "Sign In Failed",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 glass-effect shadow-xl rounded-xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Sign In</h1>
        <p className="text-muted-foreground">Access your Quantum Leap account.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? <LoadingDots /> : <><LogIn className="mr-2 h-5 w-5" /> Sign In</>}
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        {/* For now, a placeholder. You can create a /signup page later. */}
        <span className="font-medium text-primary hover:underline cursor-pointer" onClick={() => toast({title: "Sign Up", description: "Sign up functionality coming soon!"})}>
          Sign up
        </span>
      </p>
    </div>
  );
}
