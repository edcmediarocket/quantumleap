
"use client";

import React from "react";
import Image from "next/image";
import { Bot, Sparkles, AlertTriangle, Info, Rocket, Brain } from "lucide-react"; // Added Brain
import { cn } from "@/lib/utils";
import { type GetCoachQuickTipOutput } from "@/ai/flows/get-coach-quick-tip";
import { LoadingDots } from "@/components/ui/loading-dots";
import type { ActiveTabType } from '@/app/page'; // Import ActiveTabType

interface AiCoachAvatarPanelProps {
  tipData: GetCoachQuickTipOutput | null;
  isLoading: boolean;
  className?: string;
  activeTab: ActiveTabType;
}

export function AiCoachAvatarPanel({ tipData, isLoading, className, activeTab }: AiCoachAvatarPanelProps) {
  const getIconForTheme = (theme: GetCoachQuickTipOutput['suggestedActionTheme'] | undefined) => {
    switch (theme) {
      case "CAUTION":
        return <AlertTriangle className="h-5 w-5 text-orange-400 mr-2" />;
      case "ACTION":
        return <Rocket className="h-5 w-5 text-accent mr-2" />;
      case "ENGAGE":
        return <Sparkles className="h-5 w-5 text-primary mr-2" />;
      case "STRATEGY": 
        return <Brain className="h-5 w-5 text-purple-400 mr-2" />;
      case "INFO":
      default:
        return <Info className="h-5 w-5 text-blue-400 mr-2" />;
    }
  };
  
  const tipText = tipData?.quickTip || "Welcome to Quantum Leap! I'm your AI Coach, ready to help you spot opportunities.";
  const theme = tipData?.suggestedActionTheme || 'ENGAGE';

  const panelGlowClass = 
    activeTab === 'profitGoal' ? 'default-glow-accent' :
    activeTab === 'memeFlip' ? 'default-glow-orange' :
    'default-glow-primary';

  const avatarBorderColor =
    activeTab === 'profitGoal' ? 'border-accent/50' :
    activeTab === 'memeFlip' ? 'border-[hsl(var(--orange-hsl))]/50' :
    'border-primary/50';
  
  const avatarImageBgColor =
    activeTab === 'profitGoal' ? '20A0F0' : // Blue
    activeTab === 'memeFlip' ? 'F97316' :   // Orange
    'A020F0'; // Purple (default)
  
  const avatarImageUrl = `https://placehold.co/150x150/${avatarImageBgColor}/FFFFFF.png?text=QL&font=roboto`;


  return (
    <div className={cn(
        "p-4 rounded-xl glass-effect glass-effect-interactive-hover max-w-md w-full mx-auto", 
        panelGlowClass,
        className
      )}>
      <div className="flex items-center space-x-3">
        <div className={cn(
            "relative h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden border-2 shadow-lg",
            avatarBorderColor
            )}>
          <Image
            src={avatarImageUrl}
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

