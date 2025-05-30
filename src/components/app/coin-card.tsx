
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrendingUp, HelpCircle, Gauge, Target, Clock, DollarSign, Info, Brain, Terminal, RocketIcon, AlertTriangle } from "lucide-react";

import type { AiCoinPicksOutput } from "@/ai/flows/ai-coin-picks";
import type { RecommendCoinsForProfitTargetOutput } from "@/ai/flows/quick-profit-goal";
import type { MemeCoinQuickFlipOutput } from "@/ai/flows/meme-coin-quick-flip"; // New Type
import { aiCoachStrategies, type AiCoachStrategiesInput, type AiCoachStrategiesOutput } from "@/ai/flows/ai-coach-strategies";
import { CoinCandlestickChart } from "./charts/coin-candlestick-chart";

type AiPick = AiCoinPicksOutput['picks'][0];
type ProfitGoalCoin = RecommendCoinsForProfitTargetOutput['recommendedCoins'][0];
type MemeFlipCoin = MemeCoinQuickFlipOutput['picks'][0]; // New Type

type AnyCoinData = AiPick | ProfitGoalCoin | MemeFlipCoin; // Union type
type PriceRange = { low: number; high: number };

interface CoinCardProps {
  coinData: AnyCoinData;
  type: 'aiPick' | 'profitGoal' | 'memeFlip'; // Added 'memeFlip'
  profitTarget?: number; 
  riskTolerance?: 'low' | 'medium' | 'high';
}

function isAiPick(coinData: AnyCoinData, type: CoinCardProps['type']): coinData is AiPick {
  return type === 'aiPick';
}
function isProfitGoalCoin(coinData: AnyCoinData, type: CoinCardProps['type']): coinData is ProfitGoalCoin {
  return type === 'profitGoal';
}
function isMemeFlipCoin(coinData: AnyCoinData, type: CoinCardProps['type']): coinData is MemeFlipCoin {
  return type === 'memeFlip';
}

const formatPrice = (price: number): string => {
  if (price === 0) return "$0.00"; // Handle zero price
  if (Math.abs(price) < 0.000001) {
    return `$${price.toExponential(2)}`; // For very, very small numbers
  }
  if (Math.abs(price) < 0.01) {
    return `$${price.toPrecision(3)}`;
  }
  if (Math.abs(price) < 1) {
    const fixed = price.toFixed(6); // Show up to 6 decimal places
    return `$${parseFloat(fixed)}`; // Remove trailing zeros from toFixed
  }
  return `$${price.toFixed(2)}`;
};

const formatPriceRange = (range?: PriceRange): string => {
  if (!range || typeof range.low !== 'number' || typeof range.high !== 'number') return "N/A";
  return `${formatPrice(range.low)} - ${formatPrice(range.high)}`;
};


export function CoinCard({ coinData, type, profitTarget, riskTolerance }: CoinCardProps) {
  let name: string;
  let gain: number;
  let confidence: number | undefined; // Make confidence optional for meme coins if not always present
  let riskRoiGauge: number | undefined;
  let predictedPumpPotential: string | undefined;
  let riskLevel: string | undefined;

  if (isAiPick(coinData, type)) {
    name = coinData.coin;
    gain = coinData.predictedGainPercentage;
    confidence = coinData.confidenceMeter;
    riskRoiGauge = coinData.riskRoiGauge;
  } else if (isProfitGoalCoin(coinData, type)) {
    name = coinData.coinName;
    gain = coinData.estimatedGain;
    confidence = coinData.tradeConfidence;
  } else if (isMemeFlipCoin(coinData, type)) {
    name = coinData.coinName;
    gain = coinData.predictedGainPercentage; // or coinData.quickFlipSellTargetPercentage
    confidence = coinData.confidenceScore;
    predictedPumpPotential = coinData.predictedPumpPotential;
    riskLevel = coinData.riskLevel;
  } else {
    // Fallback or error
    name = "Unknown Coin";
    gain = 0;
    confidence = 0;
  }

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [coachStrategies, setCoachStrategies] = useState<AiCoachStrategiesOutput | null>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  const canShowCoach = type === 'aiPick' || type === 'profitGoal';

  useEffect(() => {
    if (isDialogOpen && canShowCoach && !coachStrategies && !isLoadingCoach) {
      const fetchCoachStrategies = async () => {
        setIsLoadingCoach(true);
        setCoachError(null);
        try {
          // Ensure coinData.entryPriceRange and exitPriceRange are valid
          if (!coinData.entryPriceRange || !coinData.exitPriceRange) {
            throw new Error("Entry or exit price range is missing for AI Coach.");
          }
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
  }, [isDialogOpen, coinData, name, gain, type, coachStrategies, isLoadingCoach, profitTarget, riskTolerance, canShowCoach]);


  const cardTitleColor = type === 'memeFlip' ? 'text-orange-400' : 'text-primary-foreground group-hover:text-primary transition-colors';
  const gainColor = gain >= 0 ? (type === 'memeFlip' ? 'text-yellow-400' : 'text-green-400') : 'text-red-400';
  const progressBg = type === 'memeFlip' ? 'bg-orange-500/20' : 'bg-primary/20';
  const progressGradientFrom = type === 'memeFlip' ? 'from-yellow-500' : 'from-accent';
  const progressGradientTo = type === 'memeFlip' ? 'to-red-500' : 'to-primary';
  const dialogButtonVariant = type === 'memeFlip' ? 'outline' : 'outline'; // Can customize further
  const dialogButtonTextColor = type === 'memeFlip' ? 'text-orange-500 border-orange-500 hover:bg-orange-500 hover:text-white' : 'border-accent text-accent hover:bg-accent hover:text-accent-foreground';
  const dialogTitleIcon = type === 'memeFlip' ? <RocketIcon className="h-6 w-6"/> : <Brain className="h-6 w-6"/>;
  const dialogTitleText = type === 'memeFlip' ? `Meme Analysis for ${name}` : `AI Analysis for ${name}`;
  const dialogDescriptionText = type === 'memeFlip' ? `Speculative insights for this meme coin. EXTREME RISK!` : `Detailed insights and coaching strategies powered by AI.`;


  return (
    <GlassCardRoot className={type === 'memeFlip' ? 'border-orange-500/30 glass-effect-hover-meme' : ''}>
      <style jsx>{`
        .glass-effect-hover-meme:hover {
          box-shadow: 0 0 25px 3px hsl(24deg 100% 50% / 0.4); /* Orange glow */
          transform: scale(1.02);
          background-color: hsl(var(--card)/0.75);
        }
      `}</style>
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <GlassCardTitle className={cardTitleColor}>{name}</GlassCardTitle>
          <div className={`flex items-center gap-2 ${gainColor}`}>
            { type === 'memeFlip' ? <RocketIcon className="h-5 w-5" /> : <TrendingUp className="h-6 w-6" /> }
            <span className="text-lg font-semibold">{gain.toFixed(1)}%</span>
          </div>
        </div>
        {isMemeFlipCoin(coinData, type) && (
          <>
            <p className="text-xs text-amber-500"><span className="font-semibold">Pump Potential:</span> {coinData.predictedPumpPotential}</p>
            <p className="text-xs text-red-500 flex items-center"><AlertTriangle className="h-3 w-3 mr-1"/> <span className="font-semibold">Risk:</span> {coinData.riskLevel}</p>
          </>
        )}
      </GlassCardHeader>
      <GlassCardContent className="space-y-3">
        <div className="grid grid-cols-[auto,1fr] items-center gap-x-2">
          <p className="text-xs text-muted-foreground justify-self-start">Entry Price:</p>
          <p className="font-medium text-foreground justify-self-end text-right">{formatPriceRange(coinData.entryPriceRange)}</p>
        </div>

        { (isAiPick(coinData, type) || isProfitGoalCoin(coinData, type) || (isMemeFlipCoin(coinData, type) && coinData.exitPriceRange)) &&
          <div className="grid grid-cols-[auto,1fr] items-center gap-x-2">
            <p className="text-xs text-muted-foreground justify-self-start">
              {isMemeFlipCoin(coinData, type) ? "Flip Target:" : "Exit Price:"}
            </p>
            <p className="font-medium text-foreground justify-self-end text-right">{formatPriceRange(coinData.exitPriceRange)}</p>
          </div>
        }

        {typeof confidence === 'number' && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Confidence:</p>
            <Progress value={confidence * 100} className={`h-2 w-full ${progressBg} [&>div]:bg-gradient-to-r [&>div]:${progressGradientFrom} [&>div]:${progressGradientTo}`} />
          </div>
        )}

        {isMemeFlipCoin(coinData, type) && coinData.suggestedBuyInWindow && (
            <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p><span className="text-muted-foreground">Buy Window:</span> {coinData.suggestedBuyInWindow}</p>
          </div>
        )}

        {coinData.estimatedDuration && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p><span className="text-muted-foreground">Est. Duration:</span> {coinData.estimatedDuration}</p>
          </div>
        )}
        
        {isAiPick(coinData, type) && riskRoiGauge !== undefined && (
          <div className="group relative">
            <p className="text-xs text-muted-foreground mb-1 flex items-center">
              Risk/ROI Gauge
              <Info className="h-3 w-3 ml-1 text-muted-foreground group-hover:text-accent transition-colors" />
            </p>
            <Progress value={riskRoiGauge * 100} className="h-2 w-full bg-primary/20 [&>div]:bg-gradient-to-r [&>div]:from-yellow-500 [&>div]:to-red-500" />
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
            <Button variant={dialogButtonVariant} size="sm" className={`w-full ${dialogButtonTextColor}`}>
              <HelpCircle className="mr-2 h-4 w-4" /> {canShowCoach ? "Why This Coin & AI Coach" : "Why This Meme Coin?"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[80vh] overflow-y-auto bg-popover text-popover-foreground glass-effect !rounded-xl">
            <DialogHeader>
              <DialogTitle className={`${type === 'memeFlip' ? 'text-orange-500' : 'text-primary'} flex items-center gap-2`}>
                {dialogTitleIcon} {dialogTitleText}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground pt-2 text-left">
                {dialogDescriptionText}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${type === 'memeFlip' ? 'text-orange-400' : 'text-accent'}`}>In-depth Rationale</h3>
                 {isMemeFlipCoin(coinData, type) && (
                  <Alert variant="destructive" className="mb-3 text-xs">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Extreme Risk Advisory</AlertTitle>
                    <AlertDescription>
                      The following rationale is for a highly speculative meme coin. Understand the significant risks involved, including total loss of investment. This is NOT financial advice.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="text-sm leading-relaxed whitespace-pre-line bg-background/30 p-4 rounded-md border border-border/30">
                  {coinData.rationale}
                </div>
              </div>

              {canShowCoach && (
                <>
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
                            {strategy.optimalBuyPrice && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium text-green-400">Optimal Buy:</span> {formatPrice(strategy.optimalBuyPrice)}</p>}
                            {strategy.targetSellPrices && strategy.targetSellPrices.length > 0 && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium text-red-400">Target Sells:</span> {strategy.targetSellPrices.map(formatPrice).join(', ')}</p>}
                            <p className="text-xs text-muted-foreground mt-2"><span className="font-medium text-accent/90">Reasoning:</span> {strategy.reasoning}</p>
                            <ul className="list-disc list-inside text-xs text-muted-foreground mt-2 space-y-1">
                              {strategy.actionableSteps.map((step, i) => <li key={i}>{step}</li>)}
                            </ul>
                             {strategy.stopLossSuggestion && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Stop-Loss:</span> {strategy.stopLossSuggestion}</p>}
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
                </>
              )}
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

    