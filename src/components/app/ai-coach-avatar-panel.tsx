
"use client";

import React from "react";
import Image from "next/image";
import { Bot, Sparkles, AlertTriangle, Info, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { type GetCoachQuickTipOutput } from "@/ai/flows/get-coach-quick-tip";
import { LoadingDots } from "@/components/ui/loading-dots";

interface AiCoachAvatarPanelProps {
  tipData: GetCoachQuickTipOutput | null;
  isLoading: boolean;
  className?: string;
}

export function AiCoachAvatarPanel({ tipData, isLoading, className }: AiCoachAvatarPanelProps) {
  const getIconForTheme = (theme: GetCoachQuickTipOutput['suggestedActionTheme'] | undefined) => {
    switch (theme) {
      case "CAUTION":
        return <AlertTriangle className="h-5 w-5 text-orange-400 mr-2" />;
      case "ACTION":
        return <Rocket className="h-5 w-5 text-accent mr-2" />;
      case "ENGAGE":
        return <Sparkles className="h-5 w-5 text-primary mr-2" />;
      case "INFO":
      default:
        return <Info className="h-5 w-5 text-blue-400 mr-2" />;
    }
  };
  
  const tipText = tipData?.quickTip || "Welcome to Quantum Leap! I'm your AI Coach, ready to help you spot opportunities.";
  const theme = tipData?.suggestedActionTheme || 'ENGAGE';

  return (
    <div className={cn("p-4 rounded-xl glass-effect max-w-md w-full mx-auto", className)}>
      <div className="flex items-center space-x-3">
        <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden border-2 border-primary/50 shadow-lg">
          <Image
            src="https://placehold.co/150x150/A020F0/FFFFFF.png?text=QL&font=roboto"
            alt="AI Coach Avatar"
            data-ai-hint="AI assistant robot"
            width={80}
            height={80}
            className="object-cover w-full h-full animate-avatar-pulse"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
             {getIconForTheme(theme)}
            <h3 className="text-sm font-semibold text-primary-foreground truncate">
              Quantum Coach
            </h3>
          </div>
          {isLoading ? (
            <LoadingDots size="sm" />
          ) : (
            <p className="text-xs md:text-sm text-muted-foreground leading-tight line-clamp-3">
              {tipText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
