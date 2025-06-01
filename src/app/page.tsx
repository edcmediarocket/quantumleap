
// src/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { AppHeader } from "@/components/app/header";
import { CoinCard } from "@/components/app/coin-card";
import { AiCoinPicksForm } from "@/components/app/forms/ai-coin-picks-form";
import { QuickProfitGoalForm } from "@/components/app/forms/quick-profit-goal-form";
import { MemeCoinQuickFlipForm } from "@/components/app/forms/meme-coin-quick-flip-form";
import { AiCoachAvatarPanel } from "@/components/app/ai-coach-avatar-panel";
import { HowItWorksPanel } from "@/components/app/how-it-works-panel";
import { CryptoTerminologyPanel } from "@/components/app/crypto-terminology-panel";
import { PredictiveBreakoutAlertsPanel } from "@/components/app/predictive-breakout-alerts-panel";
import { DailySignalsPanel } from "@/components/app/daily-signals-panel";
import { AiCoachChatbox } from "@/components/app/ai-coach-chatbox"; // New Chatbox import
import { LoadingDots } from "@/components/ui/loading-dots";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, TrendingUpIcon, BarChartIcon, RocketIcon, AlertTriangle, ShieldOff, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFeatureTogglesContext } from "@/contexts/FeatureTogglesContext"; 
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "@/lib/firebaseConfig";
import { initializeApp, getApps } from "firebase/app";


// AI Flow Imports
import { aiCoinPicks, type AiCoinPicksInput, type AiCoinPicksOutput } from "@/ai/flows/ai-coin-picks";
import { recommendCoinsForProfitTarget, type RecommendCoinsForProfitTargetInput, type RecommendCoinsForProfitTargetOutput } from "@/ai/flows/quick-profit-goal";
import { memeCoinQuickFlip, type MemeCoinQuickFlipInput, type MemeCoinQuickFlipOutput } from "@/ai/flows/meme-coin-quick-flip";
import { getCoachQuickTip, type GetCoachQuickTipInput, type GetCoachQuickTipOutput } from "@/ai/flows/get-coach-quick-tip";

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
const auth = getAuth(app);

const functionsBaseUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL;

export type ActiveTabType = 'aiPicks' | 'profitGoal' | 'memeFlip' | 'none';

export default function QuantumLeapPage() {
  const { toggles, loadingToggles, errorToggles } = useFeatureTogglesContext();

  const [aiCoinPicksResults, setAiCoinPicksResults] = useState<AiCoinPicksOutput | null>(null);
  const [quickProfitResults, setQuickProfitResults] = useState<RecommendCoinsForProfitTargetOutput | null>(null);
  const [memeFlipResults, setMemeFlipResults] = useState<MemeCoinQuickFlipOutput | null>(null);
  const [coachQuickTip, setCoachQuickTip] = useState<GetCoachQuickTipOutput | null>(null);
  
  const [isLoadingAiPicks, setIsLoadingAiPicks] = useState(false);
  const [isLoadingQuickProfit, setIsLoadingQuickProfit] = useState(false);
  const [isLoadingMemeFlip, setIsLoadingMemeFlip] = useState(false);
  const [isLoadingCoachQuickTip, setIsLoadingCoachQuickTip] = useState(false);
  
  const [aiPicksError, setAiPicksError] = useState<string | null>(null);
  const [quickProfitError, setQuickProfitError] = useState<string | null>(null);
  const [memeFlipError, setMemeFlipError] = useState<string | null>(null);
  const [coachQuickTipError, setCoachQuickTipError] = useState<string | null>(null);

  const [currentAiPicksInput, setCurrentAiPicksInput] = useState<AiCoinPicksInput | null>(null);
  const [currentQuickProfitInput, setCurrentQuickProfitInput] = useState<RecommendCoinsForProfitTargetInput | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTabType>("aiPicks"); 

  const { toast } = useToast();

  useEffect(() => {
    if (!loadingToggles) {
      if (toggles.aiCoinPicksEnabled) setActiveTab("aiPicks");
      else if (toggles.profitGoalEnabled) setActiveTab("profitGoal");
      else if (toggles.memeCoinHunterEnabled) setActiveTab("memeFlip");
      else setActiveTab("none"); 
    }
  }, [toggles, loadingToggles]);
  
  const logAiInteraction = async (userPrompt: string, aiResult: any, flowName: string) => {
    const user = auth.currentUser;
    if (!functionsBaseUrl) {
      console.warn(`CRITICAL: Firebase Functions URL (NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL) is not set in the environment. Cannot log AI interaction for "${flowName}". URL was: ${functionsBaseUrl}. Prompt: "${userPrompt}"`);
      toast({
        title: "Logging Configuration Error",
        description: "The AI interaction logging service URL is not configured. Please check environment variables.",
        variant: "destructive",
      });
      return;
    }
    
     if (!user || !user.uid) {
      console.warn(`User not logged in or UID missing. Cannot log AI interaction for "${flowName}". Interaction details: Prompt - "${userPrompt}"`);
      return; 
    }
    
    console.log(`logAiInteraction: Using functionsBaseUrl: ${functionsBaseUrl}`);
    console.log(`Attempting to POST to: ${functionsBaseUrl} for flow: ${flowName}`);

    try {
      const response = await fetch(functionsBaseUrl, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.uid, 
          userPrompt: `(${flowName}): ${userPrompt}`,
          aiResult: JSON.stringify(aiResult, null, 2) 
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Error logging AI interaction: ${response.status} ${response.statusText}`, errorData);
        throw new Error(`Server error ${response.status}: ${errorData || response.statusText}. Full URL was: ${functionsBaseUrl}`);
      }

    } catch (error) {
      console.error(`Client-side error in logAiInteraction for "${flowName}". URL: ${functionsBaseUrl}. Error object:`, error);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
          console.error("Detailed 'Failed to fetch' info: This often indicates a network issue, CORS misconfiguration on the server, the server not being reachable (check Firebase Function logs in Google Cloud Console for errors), or an issue with the request URL itself. Verify the function is deployed and healthy. Check the browser's Network tab for more details on the failed request.");
      }
    }
  };


  useEffect(() => {
    if (loadingToggles || !toggles.aiCoachEnabled) return; 

    const fetchInitialTip = async () => {
      setIsLoadingCoachQuickTip(true);
      setCoachQuickTipError(null);
      try {
        const initialTip = await getCoachQuickTip({ userActionContext: 'general' });
        setCoachQuickTip(initialTip);
        await logAiInteraction("Initial App Load", initialTip, "GetCoachQuickTip-General");
      } catch (error) {
        console.error("Error fetching initial coach tip:", error);
        setCoachQuickTipError(error instanceof Error ? error.message : "Failed to load coach wisdom.");
      } finally {
        setIsLoadingCoachQuickTip(false);
      }
    };
    fetchInitialTip();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingToggles, toggles.aiCoachEnabled]);

  const fetchAndSetCoachTip = async (context: GetCoachQuickTipInput['userActionContext'], summary?: string) => {
    if (!toggles.aiCoachEnabled) return; 

    setIsLoadingCoachQuickTip(true);
    setCoachQuickTipError(null);
    try {
      const tip = await getCoachQuickTip({ userActionContext: context, lastPicksSummary: summary });
      setCoachQuickTip(tip);
      await logAiInteraction(`Context: ${context}, Summary: ${summary || 'N/A'}`, tip, "GetCoachQuickTip-Contextual");
    } catch (error) {
      console.error(`Error fetching coach tip for ${context}:`, error);
      setCoachQuickTipError(error instanceof Error ? error.message : "Coach is pondering... tip unavailable.");
    } finally {
      setIsLoadingCoachQuickTip(false);
    }
  };


  const handleAiCoinPicksSubmit = async (data: AiCoinPicksInput) => {
    setIsLoadingAiPicks(true);
    setAiPicksError(null);
    setAiCoinPicksResults(null);
    setCurrentAiPicksInput(data); 
    const promptSummary = `Target: $${data.profitTarget}, Strat: ${data.strategy}, Risk: ${data.riskProfile}`;
    await fetchAndSetCoachTip('aiPicks', promptSummary);
    try {
      const result = await aiCoinPicks(data);
      setAiCoinPicksResults(result);
      await logAiInteraction(`AI Coin Picks Request: ${promptSummary}`, result, "AICoinPicks");
      if (!result.picks || result.picks.length === 0) {
        toast({
          title: "AI Coin Picks",
          description: "No specific coin picks found for your criteria. Try adjusting your profit target, strategy, or risk profile.",
          variant: "default",
        });
      } else {
         fetchAndSetCoachTip('aiPicks', `${result.picks.length} picks found! E.g., ${result.picks[0].coin}`);
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
    setCurrentQuickProfitInput(data);
    let promptSummary = `Goal: $${data.profitTarget}, Risk: ${data.riskTolerance}`;
    if (data.investmentAmount) {
      promptSummary += `, Invest: $${data.investmentAmount}`;
    }
    await fetchAndSetCoachTip('profitGoal', promptSummary);
    try {
      const result = await recommendCoinsForProfitTarget(data);
      setQuickProfitResults(result);
      await logAiInteraction(`Quick Profit Goal Request: ${promptSummary}`, result, "RecommendCoinsForProfitTarget");
       if (!result.recommendedCoins || result.recommendedCoins.length === 0) {
        toast({
          title: "Quick Profit Goal",
          description: "No coins found for your profit goal and risk tolerance. Consider different inputs.",
          variant: "default",
        });
      } else {
        fetchAndSetCoachTip('profitGoal', `${result.recommendedCoins.length} coins for goal! E.g., ${result.recommendedCoins[0].coinName}`);
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

  const handleMemeCoinQuickFlipSubmit = async (data: MemeCoinQuickFlipInput) => {
    setIsLoadingMemeFlip(true);
    setMemeFlipError(null);
    setMemeFlipResults(null);
    const promptSummary = `Meme Coin Hunt Triggered`;
    await fetchAndSetCoachTip('memeFlip', promptSummary);
    try {
      const result = await memeCoinQuickFlip(data);
      setMemeFlipResults(result);
      await logAiInteraction(promptSummary, result, "MemeCoinQuickFlip");
      if (!result.picks || result.picks.length === 0) {
        toast({
          title: "Meme Coin Hunter",
          description: "The AI couldn't spot any immediate meme coin opportunities. The meme-verse is quiet... for now.",
          variant: "default",
        });
      } else {
         fetchAndSetCoachTip('memeFlip', `${result.picks.length} meme rockets spotted! E.g., ${result.picks[0].coinName} 🚀`);
      }
    } catch (error) {
      console.error("Error fetching meme coin quick flips:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setMemeFlipError(`Failed to fetch meme coin flips: ${errorMessage}`);
      toast({
        title: "Error",
        description: `Failed to fetch meme coin flips. ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingMemeFlip(false);
    }
  };

  if (loadingToggles) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background text-center p-4">
        <LoadingDots size="lg" />
        <p className="text-muted-foreground mt-4">Loading Quantum Leap features...</p>
      </div>
    );
  }

  if (errorToggles) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background text-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            Could not load app configuration: {errorToggles}. Please try again later or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const enabledTabsCount = [
    toggles.aiCoinPicksEnabled,
    toggles.profitGoalEnabled,
    toggles.memeCoinHunterEnabled
  ].filter(Boolean).length;

  const chatTitleColor = 
    activeTab === 'profitGoal' ? 'text-accent' :
    activeTab === 'memeFlip' ? 'text-[hsl(var(--orange-hsl))]' :
    'text-primary';

  return (
    <div className="container mx-auto min-h-screen px-4 py-8 selection:bg-primary/30 selection:text-primary-foreground">
      <AppHeader activeTab={activeTab} />
      
      {toggles.predictiveAlertsEnabled && <PredictiveBreakoutAlertsPanel activeTab={activeTab} />}
      {toggles.dailySignalsPanelEnabled && <DailySignalsPanel activeTab={activeTab} />}


      {toggles.aiCoachEnabled && (
        <div className="my-8">
          <AiCoachAvatarPanel tipData={coachQuickTip} isLoading={isLoadingCoachQuickTip} activeTab={activeTab} />
          {coachQuickTipError && (
              <Alert variant="destructive" className="mt-2 max-w-md mx-auto text-xs">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Coach Comms Down</AlertTitle>
                  <AlertDescription>{coachQuickTipError}</AlertDescription>
              </Alert>
          )}
        </div>
      )}
      
      <main className="mt-6">
        {enabledTabsCount > 0 ? (
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTabType)} className="w-full">
            <TabsList 
              className={cn(
                "grid w-full mx-auto bg-background/50 border border-border/50 md:max-w-xl lg:max-w-2xl",
                enabledTabsCount === 3 && "grid-cols-3",
                enabledTabsCount === 2 && "grid-cols-2",
                enabledTabsCount === 1 && "grid-cols-1",
              )}
            >
              {toggles.aiCoinPicksEnabled && (
                <TabsTrigger value="aiPicks" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <TrendingUpIcon className="mr-1 sm:mr-2 h-4 w-4" /> AI Coin Picks
                </TabsTrigger>
              )}
              {toggles.profitGoalEnabled && (
                <TabsTrigger value="profitGoal" className="text-xs sm:text-sm data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <BarChartIcon className="mr-1 sm:mr-2 h-4 w-4" /> Profit Goal
                </TabsTrigger>
              )}
              {toggles.memeCoinHunterEnabled && (
                <TabsTrigger value="memeFlip" className="text-xs sm:text-sm data-[state=active]:bg-[hsl(var(--orange-hsl))] data-[state=active]:text-white">
                <RocketIcon className="mr-1 sm:mr-2 h-4 w-4" /> Meme Hunter
                </TabsTrigger>
              )}
            </TabsList>

            {toggles.aiCoinPicksEnabled && (
              <TabsContent value="aiPicks" className="mt-8">
                <div className="flex flex-col items-center gap-12">
                  <div className={cn(
                      "w-full md:max-w-md lg:max-w-lg p-6 shadow-xl",
                      "glass-effect glass-effect-interactive-hover default-glow-primary"
                    )}>
                    <h2 className="text-2xl font-semibold mb-6 text-primary flex items-center">
                      <TrendingUpIcon className="mr-2 h-6 w-6" /> Configure AI Picks
                    </h2>
                    <AiCoinPicksForm onSubmit={handleAiCoinPicksSubmit} isLoading={isLoadingAiPicks} />
                  </div>
                  <div className="w-full">
                    {isLoadingAiPicks && <LoadingDots className="mt-10" size="lg" />}
                    {aiPicksError && (
                      <Alert variant="destructive" className="mt-6 max-w-2xl mx-auto">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{aiPicksError}</AlertDescription>
                      </Alert>
                    )}
                    {aiCoinPicksResults && aiCoinPicksResults.picks.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {aiCoinPicksResults.picks.map((pick, index) => (
                          <CoinCard 
                            key={`${pick.coin}-${index}`} 
                            coinData={pick} 
                            type="aiPick"
                            profitTarget={currentAiPicksInput?.profitTarget}
                            riskProfile={currentAiPicksInput?.riskProfile}
                          />
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
            )}

            {toggles.profitGoalEnabled && (
              <TabsContent value="profitGoal" className="mt-8">
                <div className="flex flex-col items-center gap-12">
                  <div className={cn(
                      "w-full md:max-w-md lg:max-w-lg p-6 shadow-xl",
                      "glass-effect glass-effect-interactive-hover default-glow-accent"
                    )}>
                    <h2 className="text-2xl font-semibold mb-6 text-accent flex items-center">
                      <BarChartIcon className="mr-2 h-6 w-6" /> Set Your Profit Goal
                    </h2>
                    <QuickProfitGoalForm onSubmit={handleQuickProfitGoalSubmit} isLoading={isLoadingQuickProfit} />
                  </div>
                  <div className="w-full">
                    {isLoadingQuickProfit && <LoadingDots className="mt-10" size="lg" />}
                    {quickProfitError && (
                      <Alert variant="destructive" className="mt-6 max-w-2xl mx-auto">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{quickProfitError}</AlertDescription>
                      </Alert>
                    )}
                    {quickProfitResults && quickProfitResults.recommendedCoins.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {quickProfitResults.recommendedCoins.map((coin, index) => (
                          <CoinCard 
                            key={`${coin.coinName}-${index}`} 
                            coinData={coin} 
                            type="profitGoal"
                            profitTarget={currentQuickProfitInput?.profitTarget}
                            investmentAmount={currentQuickProfitInput?.investmentAmount}
                            riskTolerance={currentQuickProfitInput?.riskTolerance}
                          />
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
            )}

            {toggles.memeCoinHunterEnabled && (
              <TabsContent value="memeFlip" className="mt-8">
                <div className="flex flex-col items-center gap-12">
                  <div className={cn(
                      "w-full md:max-w-md lg:max-w-lg p-6 shadow-xl",
                      "glass-effect glass-effect-interactive-hover default-glow-orange"
                    )}>
                    <h2 className="text-2xl font-semibold mb-6 text-[hsl(var(--orange-hsl))] flex items-center">
                      <RocketIcon className="mr-2 h-6 w-6" /> Meme Coin Hunter
                    </h2>
                    <MemeCoinQuickFlipForm onSubmit={handleMemeCoinQuickFlipSubmit} isLoading={isLoadingMemeFlip} />
                    <Alert variant="destructive" className="mt-6 text-xs">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Extreme Risk Warning!</AlertTitle>
                        <AlertDescription>
                          Meme coins are highly speculative and carry extreme risk. You can lose your entire investment. This is not financial advice. Always DYOR!
                        </AlertDescription>
                      </Alert>
                  </div>
                  <div className="w-full">
                    {isLoadingMemeFlip && <LoadingDots className="mt-10" size="lg" />}
                    {memeFlipError && (
                      <Alert variant="destructive" className="mt-6 max-w-2xl mx-auto">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Meme Hunter Error</AlertTitle>
                        <AlertDescription>{memeFlipError}</AlertDescription>
                      </Alert>
                    )}
                    {memeFlipResults && memeFlipResults.picks.length > 0 && (
                      <>
                        <Alert variant="default" className="mb-4 bg-background/30 border-amber-500/50 max-w-3xl mx-auto">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <AlertTitle className="text-amber-500">Overall Meme Disclaimer</AlertTitle>
                          <AlertDescription className="text-muted-foreground">{memeFlipResults.overallDisclaimer}</AlertDescription>
                        </Alert>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {memeFlipResults.picks.map((pick, index) => (
                            <CoinCard 
                              key={`${pick.coinName}-${index}`} 
                              coinData={pick} 
                              type="memeFlip"
                            />
                          ))}
                        </div>
                      </>
                    )}
                    {memeFlipResults && memeFlipResults.picks.length === 0 && !isLoadingMemeFlip && !memeFlipError && (
                      <div className="text-center py-10 text-muted-foreground">
                        <p>The Meme Hunter found no immediate explosive opportunities.</p>
                        <p>The meme-verse can be fickle. Try again later!</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        ) : (
           <div className="text-center py-12">
              <ShieldOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold text-muted-foreground mb-2">No Features Enabled</h2>
              <p className="text-muted-foreground">
                It looks like all primary features are currently disabled. Please check back later or contact an administrator.
              </p>
            </div>
        )}

        {/* AI Coach Chatbox Section */}
        {toggles.aiCoachChatboxEnabled && (
          <section className="mt-16 mb-8">
            <div className="text-center mb-10">
              <h2 className={cn(
                "text-3xl font-bold tracking-tight flex items-center justify-center gap-3",
                chatTitleColor
              )}>
                <MessageSquare className={cn("h-8 w-8", chatTitleColor)} />
                Chat with Quantum AI Coach
              </h2>
              <p className="text-muted-foreground mt-2 md:text-lg">
                Ask questions, get explanations, and learn about crypto trading.
              </p>
            </div>
            <AiCoachChatbox logAiInteraction={logAiInteraction} activeTab={activeTab} />
          </section>
        )}


        <HowItWorksPanel activeTab={activeTab} />
        <CryptoTerminologyPanel activeTab={activeTab} />

      </main>
       <footer className="mt-12 py-4 text-center text-xs text-muted-foreground/70 border-t border-border/20">
        <p>AI-generated insights are for informational purposes only and not financial advice. Cryptocurrency investments are subject to high market risk. Predictions are not guaranteed. DYOR!</p>
        <p>©️ 2025 Designed By Corey Dean | All Rights Reserved</p>
      </footer>
    </div>
  );
}

    
