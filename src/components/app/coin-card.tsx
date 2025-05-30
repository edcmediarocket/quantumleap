// src/components/app/coin-card.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  GlassCardRoot,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassCardFooter
} from "./glass-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter, // Import DialogFooter
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator"; // Import Separator
import { LoadingDots } from "@/components/ui/loading-dots";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrendingUp, HelpCircle, Gauge, Target, Clock, DollarSign, Info, Brain, Terminal } from "lucide-react";

import type { AiCoinPicksOutput } from "@/ai/flows/ai-coin-picks";
import type { RecommendCoinsForProfitTargetOutput } from "@/ai/flows/quick-profit-goal";
import { aiCoachStrategies, type AiCoachStrategiesInput, type AiCoachStrategiesOutput } from "@/ai/flows/ai-coach-strategies";
import { CoinCandlestickChart } from "./charts/coin-candlestick-chart";

type CoinPick = AiCoinPicksOutput['picks'][0];
type ProfitCoin = RecommendCoinsForProfitTargetOutput['recommendedCoins'][0];
type PriceRange = { low: number; high: number };

interface CoinCardProps {
  coinData: CoinPick | ProfitCoin;
  type: 'aiPick' | 'profitGoal';
  // To pass to AI Coach if needed for profit goal type
  profitTarget?: number; 
  riskTolerance?: 'low' | 'medium' | 'high';
}

function isAiPick(coinData: CoinPick | ProfitCoin, type: 'aiPick' | 'profitGoal'): coinData is CoinPick {
  return type === 'aiPick';
}

const formatPrice = (price: number): string => {
  if (price < 0.001) {
    return `$${price.toPrecision(3)}`; // For very small numbers, use precision
  }
  if (price < 1) {
     // Show more decimals for prices less than $1
    return `$${price.toFixed(Math.max(2, (price.toString().split('.')[1] || '').length))}`;
  }
  return `$${price.toFixed(2)}`; // Standard two decimal places for $1 and above
};

const formatPriceRange = (range: PriceRange): string => {
  return `${formatPrice(range.low)} - ${formatPrice(range.high)}`;
};


export function CoinCard({ coinData, type, profitTarget, riskTolerance }: CoinCardProps) {
  const name = isAiPick(coinData, type) ? coinData.coin : coinData.coinName;
  const gain = isAiPick(coinData, type) ? coinData.predictedGainPercentage : coinData.estimatedGain;
  const confidence = isAiPick(coinData, type) ? coinData.confidenceMeter : coinData.tradeConfidence;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [coachStrategies, setCoachStrategies] = useState<AiCoachStrategiesOutput | null>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  useEffect(() => {
    if (isDialogOpen && !coachStrategies && !isLoadingCoach) {
      const fetchCoachStrategies = async () => {
        setIsLoadingCoach(true);
        setCoachError(null);
        try {
          const input: AiCoachStrategiesInput = {
            coinName: name,
            currentRationale: coinData.rationale,
            predictedGainPercentage: gain,
            entryPriceRange: coinData.entryPriceRange,
            exitPriceRange: coinData.exitPriceRange,
            estimatedDuration: coinData.estimatedDuration || "Not specified",
            ...(profitTarget && { profitTarget }),
            ...(riskTolerance && { riskTolerance }),
          };
          const result = await aiCoachStrategies(input);
          setCoachStrategies(result);
        } catch (error) {
          console.error("Error fetching AI coach strategies:", error);
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
          setCoachError(`Failed to fetch AI coach strategies: ${errorMessage}`);
        } finally {
          setIsLoadingCoach(false);
        }
      };
      fetchCoachStrategies();
    }
  }, [isDialogOpen, coinData, name, gain, type, coachStrategies, isLoadingCoach, profitTarget, riskTolerance]);


  return (
    <GlassCardRoot>
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <GlassCardTitle>{name}</GlassCardTitle>
          <div className={`flex items-center gap-2 ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <TrendingUp className="h-6 w-6" />
            <span className="text-lg font-semibold">{gain.toFixed(2)}%</span>
          </div>
        </div>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4"> {/* Increased spacing */}
        <div className="grid grid-cols-[auto,1fr] items-center gap-x-2">
          <p className="text-xs text-muted-foreground justify-self-start">Entry Price:</p>
          <p className="font-medium text-foreground justify-self-end text-right">{formatPriceRange(coinData.entryPriceRange)}</p>
        </div>
        <div className="grid grid-cols-[auto,1fr] items-center gap-x-2">
          <p className="text-xs text-muted-foreground justify-self-start">Exit Price:</p>
          <p className="font-medium text-foreground justify-self-end text-right">{formatPriceRange(coinData.exitPriceRange)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Confidence:</p>
          <Progress value={confidence * 100} className="h-2 w-full bg-primary/20 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary" />
        </div>
        {coinData.estimatedDuration && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p><span className="text-muted-foreground">Est. Duration:</span> {coinData.estimatedDuration}</p>
          </div>
        )}
        {isAiPick(coinData, type) && coinData.riskRoiGauge !== undefined && (
          <div className="group relative">
            <p className="text-xs text-muted-foreground mb-1 flex items-center">
              Risk/ROI Gauge
              <Info className="h-3 w-3 ml-1 text-muted-foreground group-hover:text-accent transition-colors" />
            </p>
            <Progress value={coinData.riskRoiGauge * 100} className="h-2 w-full bg-primary/20 [&>div]:bg-gradient-to-r [&>div]:from-yellow-500 [&>div]:to-red-500" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden w-60 rounded-md bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg group-hover:block z-10 text-center">
              Indicates risk vs. reward. Higher means higher potential reward but also higher risk.
            </div>
          </div>
        )}
         <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-1">Chart Preview (Mock Data):</p>
            <CoinCandlestickChart data={coinData.mockCandlestickData} />
          </div>
      </GlassCardContent>
      <GlassCardFooter>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              <HelpCircle className="mr-2 h-4 w-4" /> Why This Coin & AI Coach
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[80vh] overflow-y-auto bg-popover text-popover-foreground glass-effect !rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-primary flex items-center gap-2">
                <Brain className="h-6 w-6"/> AI Analysis for {name}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground pt-2 text-left">
                Detailed insights and coaching strategies powered by AI.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-accent">In-depth Rationale</h3>
                <div className="text-sm leading-relaxed whitespace-pre-line bg-background/30 p-4 rounded-md border border-border/30">
                  {coinData.rationale}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-2 text-accent flex items-center gap-2">
                  <Brain className="h-5 w-5" /> AI Coach Strategies
                </h3>
                {isLoadingCoach && <LoadingDots />}
                {coachError && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Coaching Error</AlertTitle>
                    <AlertDescription>{coachError}</AlertDescription>
                  </Alert>
                )}
                {coachStrategies && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-primary-foreground/90">Coin-Specific Advice:</h4>
                      <p className="text-sm text-muted-foreground pl-2 border-l-2 border-primary ml-1 py-1 italic">{coachStrategies.coinSpecificAdvice}</p>
                    </div>
                    {coachStrategies.investmentStrategies.map((strategy, index) => (
                      <div key={index} className="p-3 rounded-md bg-card/50 border border-border/40">
                        <h4 className="font-semibold text-primary-foreground">{strategy.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{strategy.description}</p>
                        <p className="text-xs text-muted-foreground mt-2"><span className="font-medium text-accent/90">Reasoning:</span> {strategy.reasoning}</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground mt-2 space-y-1">
                          {strategy.actionableSteps.map((step, i) => <li key={i}>{step}</li>)}
                        </ul>
                      </div>
                    ))}
                     <div>
                      <h4 className="font-medium text-primary-foreground/90">Overall Outlook & Risk Management:</h4>
                      <p className="text-sm text-muted-foreground pl-2 border-l-2 border-primary ml-1 py-1 italic">{coachStrategies.overallCoachSOutlook}</p>
                    </div>
                    <p className="text-xs text-center text-muted-foreground/70 pt-2">{coachStrategies.disclaimer}</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </GlassCardFooter>
    </GlassCardRoot>
  );
}
