
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
import Link from 'next/link';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, Auth, AuthError } from 'firebase/auth';
import { firebaseConfig } from '@/lib/firebaseConfig';
import { UserPlus, AlertTriangle } from 'lucide-react';
import { LoadingDots } from '@/components/ui/loading-dots';

let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error in signup-form:", error);
  }
} else {
  app = getApps()[0];
}

if (app! && !auth) {
  try {
    auth = getAuth(app);
  } catch (error) {
    console.error("Error initializing Firebase Auth in signup-form:", error);
  }
}

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password." })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path to field that gets the error
});

type SignUpFormValues = z.infer<typeof formSchema>;

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    },
  });

  const onSubmit = async (values: SignUpFormValues) => {
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
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Account Created Successfully!",
        description: "Welcome! You can now sign in.",
      });
      router.push('/signin'); 
    } catch (err) {
      const authError = err as AuthError;
      let friendlyMessage = "An unexpected error occurred. Please try again.";
      switch (authError.code) {
        case 'auth/email-already-in-use':
          friendlyMessage = "This email address is already in use. Try signing in instead.";
          break;
        case 'auth/invalid-email':
          friendlyMessage = "The email address is not valid.";
          break;
        case 'auth/weak-password':
          friendlyMessage = "The password is too weak. Please choose a stronger password.";
          break;
        default:
          console.error("Firebase Sign-Up Error:", authError);
      }
      setError(friendlyMessage);
      toast({
        title: "Sign Up Failed",
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
        <h1 className="text-3xl font-bold text-primary">Create Account</h1>
        <p className="text-muted-foreground">Join Quantum Leap today.</p>
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
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
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
            {isLoading ? <LoadingDots /> : <><UserPlus className="mr-2 h-5 w-5" /> Sign Up</>}
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/signin" className="font-medium text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
