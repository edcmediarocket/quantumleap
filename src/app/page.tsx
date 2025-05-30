"use client";

import React, { useState, Suspense } from "react";
import { AppHeader } from "@/components/app/header";
import { CoinCard } from "@/components/app/coin-card";
import { AiCoinPicksForm } from "@/components/app/forms/ai-coin-picks-form";
import { QuickProfitGoalForm } from "@/components/app/forms/quick-profit-goal-form";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, TrendingUpIcon, BarChartIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// AI Flow Imports
import { aiCoinPicks, type AiCoinPicksInput, type AiCoinPicksOutput } from "@/ai/flows/ai-coin-picks";
import { recommendCoinsForProfitTarget, type RecommendCoinsForProfitTargetInput, type RecommendCoinsForProfitTargetOutput } from "@/ai/flows/quick-profit-goal";

export default function QuantumLeapPage() {
  const [aiCoinPicksResults, setAiCoinPicksResults] = useState<AiCoinPicksOutput | null>(null);
  const [quickProfitResults, setQuickProfitResults] = useState<RecommendCoinsForProfitTargetOutput | null>(null);
  
  const [isLoadingAiPicks, setIsLoadingAiPicks] = useState(false);
  const [isLoadingQuickProfit, setIsLoadingQuickProfit] = useState(false);
  
  const [aiPicksError, setAiPicksError] = useState<string | null>(null);
  const [quickProfitError, setQuickProfitError] = useState<string | null>(null);

  const { toast } = useToast();

  const handleAiCoinPicksSubmit = async (data: AiCoinPicksInput) => {
    setIsLoadingAiPicks(true);
    setAiPicksError(null);
    setAiCoinPicksResults(null);
    try {
      const result = await aiCoinPicks(data);
      setAiCoinPicksResults(result);
      if (!result.picks || result.picks.length === 0) {
        toast({
          title: "AI Coin Picks",
          description: "No specific coin picks found for your criteria. Try adjusting your profit target or strategy.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching AI coin picks:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setAiPicksError(`Failed to fetch AI coin picks: ${errorMessage}`);
      toast({
        title: "Error",
        description: `Failed to fetch AI coin picks. ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingAiPicks(false);
    }
  };

  const handleQuickProfitGoalSubmit = async (data: RecommendCoinsForProfitTargetInput) => {
    setIsLoadingQuickProfit(true);
    setQuickProfitError(null);
    setQuickProfitResults(null);
    try {
      const result = await recommendCoinsForProfitTarget(data);
      setQuickProfitResults(result);
       if (!result.recommendedCoins || result.recommendedCoins.length === 0) {
        toast({
          title: "Quick Profit Goal",
          description: "No coins found for your profit goal and risk tolerance. Consider different inputs.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching quick profit goal recommendations:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setQuickProfitError(`Failed to fetch recommendations: ${errorMessage}`);
      toast({
        title: "Error",
        description: `Failed to fetch recommendations. ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingQuickProfit(false);
    }
  };

  return (
    <div className="container mx-auto min-h-screen px-4 py-8 selection:bg-primary/30 selection:text-primary-foreground">
      <AppHeader />

      <main className="mt-12">
        <Tabs defaultValue="aiPicks" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto bg-background/50 border border-border/50">
            <TabsTrigger value="aiPicks" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUpIcon className="mr-2 h-4 w-4" /> AI Coin Picks
            </TabsTrigger>
            <TabsTrigger value="profitGoal" className="text-xs sm:text-sm data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
             <BarChartIcon className="mr-2 h-4 w-4" /> Quick Profit Goal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aiPicks" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-1 p-6 rounded-xl bg-card/30 border border-border/20 shadow-lg">
                <h2 className="text-2xl font-semibold mb-6 text-primary flex items-center">
                  <TrendingUpIcon className="mr-2 h-6 w-6" /> Configure AI Picks
                </h2>
                <AiCoinPicksForm onSubmit={handleAiCoinPicksSubmit} isLoading={isLoadingAiPicks} />
              </div>
              <div className="md:col-span-2">
                {isLoadingAiPicks && <LoadingDots className="mt-10" size="lg" />}
                {aiPicksError && (
                  <Alert variant="destructive" className="mt-6">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{aiPicksError}</AlertDescription>
                  </Alert>
                )}
                {aiCoinPicksResults && aiCoinPicksResults.picks.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {aiCoinPicksResults.picks.map((pick, index) => (
                      <CoinCard key={`${pick.coin}-${index}`} coinData={pick} type="aiPick" />
                    ))}
                  </div>
                )}
                {aiCoinPicksResults && aiCoinPicksResults.picks.length === 0 && !isLoadingAiPicks && !aiPicksError && (
                   <div className="text-center py-10 text-muted-foreground">
                    <p>No AI coin picks match your current criteria.</p>
                    <p>Try adjusting the profit target or strategy.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profitGoal" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-1 p-6 rounded-xl bg-card/30 border border-border/20 shadow-lg">
                 <h2 className="text-2xl font-semibold mb-6 text-accent flex items-center">
                  <BarChartIcon className="mr-2 h-6 w-6" /> Set Your Profit Goal
                </h2>
                <QuickProfitGoalForm onSubmit={handleQuickProfitGoalSubmit} isLoading={isLoadingQuickProfit} />
              </div>
              <div className="md:col-span-2">
                {isLoadingQuickProfit && <LoadingDots className="mt-10" size="lg" />}
                {quickProfitError && (
                  <Alert variant="destructive" className="mt-6">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{quickProfitError}</AlertDescription>
                  </Alert>
                )}
                {quickProfitResults && quickProfitResults.recommendedCoins.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {quickProfitResults.recommendedCoins.map((coin, index) => (
                      <CoinCard key={`${coin.coinName}-${index}`} coinData={coin} type="profitGoal" />
                    ))}
                  </div>
                )}
                {quickProfitResults && quickProfitResults.recommendedCoins.length === 0 && !isLoadingQuickProfit && !quickProfitError && (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No coins found for your profit goal and risk tolerance.</p>
                    <p>Try adjusting your inputs.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
