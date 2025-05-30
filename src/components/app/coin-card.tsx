
// src/components/app/coin-card.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  GlassCardRoot,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassCardFooter
} from "./glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { TrendingUp, HelpCircle, Gauge, Target, Clock, DollarSign, Info, Brain, Terminal, RocketIcon, AlertTriangle, Calculator, TimerIcon, BellIcon, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import type { AiCoinPicksOutput } from "@/ai/flows/ai-coin-picks";
import type { RecommendCoinsForProfitTargetOutput } from "@/ai/flows/quick-profit-goal";
import type { MemeCoinQuickFlipOutput } from "@/ai/flows/meme-coin-quick-flip";
import { aiCoachStrategies, type AiCoachStrategiesInput, type AiCoachStrategiesOutput } from "@/ai/flows/ai-coach-strategies";

type AiPick = AiCoinPicksOutput['picks'][0];
type ProfitGoalCoin = RecommendCoinsForProfitTargetOutput['recommendedCoins'][0];
type MemeFlipCoin = MemeCoinQuickFlipOutput['picks'][0];

type AnyCoinData = AiPick | ProfitGoalCoin | MemeFlipCoin;
type PriceRange = { low: number; high: number };

interface CoinCardProps {
  coinData: AnyCoinData;
  type: 'aiPick' | 'profitGoal' | 'memeFlip';
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

const formatPrice = (price: number | undefined | null): string => {
  if (typeof price !== 'number' || isNaN(price)) return "$N/A";
  if (price === 0) return "$0.00";

  if (Math.abs(price) < 0.000000001 && price !== 0) {
    return `$${price.toExponential(2)}`;
  }
  if (Math.abs(price) < 0.01) {
    let priceStr = price.toFixed(12);
    let [integerPart, decimalPart] = priceStr.split('.');

    if (decimalPart) {
        let significantDecimal = "";
        let nonZeroFound = false;
        let nonZeroCount = 0;
        let leadingZeros = "";

        for (const char of decimalPart) {
            if (char !== '0') {
                nonZeroFound = true;
            }
            if (nonZeroFound) {
                 significantDecimal += char;
                 nonZeroCount++;
            } else if (leadingZeros.length < 8) {
                leadingZeros += char;
            }
            if (nonZeroCount >= 2 && (leadingZeros + significantDecimal).length >=4 ) break;
            if ((leadingZeros + significantDecimal).length >= 10) break;
        }

        significantDecimal = (leadingZeros + significantDecimal).replace(/0+$/, '');
        if (significantDecimal.length === 0 && integerPart === '0') return `$0.00...`;
        if (significantDecimal.length === 0) return `$${integerPart}.00`;
        return `$${integerPart}.${significantDecimal.substring(0,10)}`;
    } else {
         return `$${integerPart}.00`;
    }
  }
  if (Math.abs(price) < 1) {
    return `$${price.toFixed(4).replace(/0+$/, '').replace(/\.$/,'.00')}`;
  }
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};


const formatPriceRange = (range?: PriceRange): string => {
  if (!range || typeof range.low !== 'number' || typeof range.high !== 'number') return "N/A";
  return `${formatPrice(range.low)} - ${formatPrice(range.high)}`;
};

const parseCountdownTextToSeconds = (text: string | undefined): number | null => {
  if (!text) return null;
  let totalSeconds = 0;
  const hourMatch = text.match(/(\d+)\s*hour/i);
  const minMatch = text.match(/(\d+)\s*min/i);

  if (hourMatch) totalSeconds += parseInt(hourMatch[1], 10) * 3600;
  if (minMatch) totalSeconds += parseInt(minMatch[1], 10) * 60;

  if (!hourMatch && !minMatch) {
    const numMatch = text.match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (num <= 120) totalSeconds += num * 60; 
      else return null;
    }
  }
  return totalSeconds > 0 ? totalSeconds : null;
};

const formatSecondsToCountdown = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "Now / Overdue";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  let parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (hours === 0 && minutes < 30) { 
    parts.push(`${seconds}s`);
  }
  return parts.join(' ') || "Calculating...";
};


export function CoinCard({ coinData, type, profitTarget, riskTolerance }: CoinCardProps) {
  let name: string;
  let gain: number;
  let confidence: number | undefined;
  let riskRoiGauge: number | undefined;
  let predictedPumpPotential: string | undefined;
  let riskLevel: string | undefined;
  let rationale: string;
  let entryPriceRange: PriceRange | undefined;
  let exitPriceRange: PriceRange | undefined;
  let estimatedDuration: string | undefined;
  let predictedEntryWindowDescription: string | undefined;
  let predictedExitWindowDescription: string | undefined;
  let simulatedEntryCountdownText: string | undefined;
  let simulatedPostBuyDropAlertText: string | undefined;


  const [purchaseQuantity, setPurchaseQuantity] = useState<number | null>(null);
  const [estimatedSellPrice, setEstimatedSellPrice] = useState<number | null>(null);
  const [calculatedProfit, setCalculatedProfit] = useState<number | null>(null);
  const [averageEntryPrice, setAverageEntryPrice] = useState<number | null>(null);
  const [totalBuyCost, setTotalBuyCost] = useState<number | null>(null);

  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();


  if (isAiPick(coinData, type)) {
    name = coinData.coin;
    gain = coinData.predictedGainPercentage;
    confidence = coinData.confidenceMeter;
    riskRoiGauge = coinData.riskRoiGauge;
    rationale = coinData.rationale;
    entryPriceRange = coinData.entryPriceRange;
    exitPriceRange = coinData.exitPriceRange;
    estimatedDuration = coinData.estimatedDuration;
    predictedEntryWindowDescription = coinData.predictedEntryWindowDescription;
    predictedExitWindowDescription = coinData.predictedExitWindowDescription;
    simulatedEntryCountdownText = coinData.simulatedEntryCountdownText;
    simulatedPostBuyDropAlertText = coinData.simulatedPostBuyDropAlertText;
  } else if (isProfitGoalCoin(coinData, type)) {
    name = coinData.coinName;
    gain = coinData.estimatedGain;
    confidence = coinData.tradeConfidence;
    rationale = coinData.rationale;
    entryPriceRange = coinData.entryPriceRange;
    exitPriceRange = coinData.exitPriceRange;
    estimatedDuration = coinData.estimatedDuration;
    predictedEntryWindowDescription = coinData.predictedEntryWindowDescription;
    predictedExitWindowDescription = coinData.predictedExitWindowDescription;
    simulatedEntryCountdownText = coinData.simulatedEntryCountdownText;
    simulatedPostBuyDropAlertText = coinData.simulatedPostBuyDropAlertText;
  } else if (isMemeFlipCoin(coinData, type)) {
    name = coinData.coinName;
    gain = coinData.predictedGainPercentage;
    confidence = coinData.confidenceScore;
    predictedPumpPotential = coinData.predictedPumpPotential;
    riskLevel = coinData.riskLevel;
    rationale = coinData.rationale;
    entryPriceRange = coinData.entryPriceRange;
    exitPriceRange = coinData.exitPriceRange;
    estimatedDuration = coinData.estimatedDuration;
    predictedEntryWindowDescription = coinData.predictedEntryWindowDescription;
    predictedExitWindowDescription = coinData.predictedExitWindowDescription;
    simulatedEntryCountdownText = coinData.simulatedEntryCountdownText;
    simulatedPostBuyDropAlertText = coinData.simulatedPostBuyDropAlertText;
  } else {
    name = "Unknown Coin";
    gain = 0;
    confidence = 0;
    rationale = "No rationale available.";
  }

  useEffect(() => {
    if (entryPriceRange?.low && entryPriceRange?.high) {
      const avgEntry = (entryPriceRange.low + entryPriceRange.high) / 2;
      setAverageEntryPrice(avgEntry > 0 ? avgEntry : entryPriceRange.low); 
    }
  }, [entryPriceRange]);

  useEffect(() => {
    if (purchaseQuantity !== null && averageEntryPrice !== null && purchaseQuantity > 0 && averageEntryPrice > 0) {
      setTotalBuyCost(purchaseQuantity * averageEntryPrice);
      if (estimatedSellPrice !== null && estimatedSellPrice >= 0) {
        const totalRevenue = purchaseQuantity * estimatedSellPrice;
        setCalculatedProfit(totalRevenue - (purchaseQuantity * averageEntryPrice));
      } else {
        setCalculatedProfit(null);
      }
    } else {
      setTotalBuyCost(null);
      setCalculatedProfit(null);
    }
  }, [purchaseQuantity, estimatedSellPrice, averageEntryPrice]);

  useEffect(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    const initialSeconds = parseCountdownTextToSeconds(simulatedEntryCountdownText);
    setCountdownSeconds(initialSeconds);

    if (initialSeconds !== null && initialSeconds > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdownSeconds(prevSeconds => {
          if (prevSeconds === null || prevSeconds <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
             toast({ title: `${name} Entry Window`, description: "AI-suggested entry window is now active or has passed." });
            return 0;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [simulatedEntryCountdownText, name, toast]);


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
          if (!entryPriceRange || !exitPriceRange) {
            throw new Error("Entry or exit price range is missing for AI Coach.");
          }
          const input: AiCoachStrategiesInput = {
            coinName: name,
            currentRationale: rationale,
            predictedGainPercentage: gain,
            entryPriceRange: entryPriceRange,
            exitPriceRange: exitPriceRange,
            estimatedDuration: estimatedDuration || "Not specified",
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
  }, [isDialogOpen, name, gain, type, coachStrategies, isLoadingCoach, profitTarget, riskTolerance, canShowCoach, rationale, entryPriceRange, exitPriceRange, estimatedDuration]);

  const handleSimulateDumpAlert = () => {
    const alertText = simulatedPostBuyDropAlertText || `SIMULATED ALERT: ${name} is showing a mock -10% drop! AI suggests re-evaluating.`;
    setTimeout(() => {
      toast({
        variant: "destructive",
        title: "Simulated Price Dump!",
        description: alertText,
      });
    }, 3000); 
  };


  const cardTitleColor = type === 'memeFlip' ? 'text-orange-400' : 'text-primary-foreground group-hover:text-primary transition-colors';
  const gainColor = gain >= 0 ? (type === 'memeFlip' ? 'text-yellow-400' : 'text-green-400') : 'text-red-400';
  const progressBg = type === 'memeFlip' ? 'bg-orange-500/20' : 'bg-primary/20';
  const progressGradientFrom = type === 'memeFlip' ? 'from-yellow-500' : 'from-accent';
  const progressGradientTo = type === 'memeFlip' ? 'to-red-500' : 'to-primary';
  const dialogButtonVariant = type === 'memeFlip' ? 'outline' : 'outline';
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
            {predictedPumpPotential && <p className="text-xs text-amber-500"><span className="font-semibold">Pump Potential:</span> {predictedPumpPotential}</p>}
            {riskLevel && <p className="text-xs text-red-500 flex items-center"><AlertTriangle className="h-3 w-3 mr-1"/> <span className="font-semibold">Risk:</span> {riskLevel}</p>}
          </>
        )}
      </GlassCardHeader>
      <GlassCardContent className="space-y-3">
        <div className="grid grid-cols-[auto,1fr] items-center gap-x-2">
          <p className="text-xs text-muted-foreground justify-self-start">Entry Price:</p>
          <p className="font-medium text-foreground justify-self-end text-right">{formatPriceRange(entryPriceRange)}</p>
        </div>

        { (isAiPick(coinData, type) || isProfitGoalCoin(coinData, type) || (isMemeFlipCoin(coinData, type) && coinData.exitPriceRange)) &&
          <div className="grid grid-cols-[auto,1fr] items-center gap-x-2">
            <p className="text-xs text-muted-foreground justify-self-start">
              {isMemeFlipCoin(coinData, type) ? "Flip Target:" : "Exit Price:"}
            </p>
            <p className="font-medium text-foreground justify-self-end text-right">{formatPriceRange(exitPriceRange)}</p>
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

        {estimatedDuration && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p><span className="text-muted-foreground">Est. Duration:</span> {estimatedDuration}</p>
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

        {(predictedEntryWindowDescription || countdownSeconds !== null || predictedExitWindowDescription || simulatedPostBuyDropAlertText) && (
          <div className="mt-3 pt-3 border-t border-border/20 space-y-2">
            <h4 className="text-sm font-semibold text-primary-foreground/80 flex items-center">
              <TimerIcon className="h-4 w-4 mr-2 text-accent" /> AI Timing &amp; Alerts
            </h4>
            {predictedEntryWindowDescription && (
              <p className="text-xs text-muted-foreground"><span className="font-medium">Entry Suggestion:</span> {predictedEntryWindowDescription}</p>
            )}
            {countdownSeconds !== null && (
              <div className="text-xs">
                <span className="font-medium text-green-400">Simulated Ideal Entry In: </span>
                <span className="font-mono">{formatSecondsToCountdown(countdownSeconds)}</span>
                <p className="text-[10px] text-muted-foreground/70">⚠️ AI-suggested, not a live market prediction.</p>
              </div>
            )}
            {predictedExitWindowDescription && (
              <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Exit Suggestion:</span> {predictedExitWindowDescription}</p>
            )}
            {simulatedPostBuyDropAlertText && (
              <div className="mt-2">
                <p className="text-xs text-red-400/90"><span className="font-medium">Potential Dump Scenario:</span> {simulatedPostBuyDropAlertText}</p>
                <Button onClick={handleSimulateDumpAlert} size="sm" variant="destructive" className="text-xs mt-1 h-7 px-2 py-1 opacity-80 hover:opacity-100">
                  <BellIcon className="h-3 w-3 mr-1"/> Simulate Dump Alert
                </Button>
              </div>
            )}
          </div>
        )}


        {isMemeFlipCoin(coinData, type) && (
          <>
            <Separator className="my-3 border-orange-500/30" />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-orange-400 flex items-center">
                <Calculator className="h-4 w-4 mr-2" />
                Quick Flip Profit Estimator
              </h4>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <Label htmlFor={`quantity-${name.replace(/\s+/g, '-')}`} className="text-xs text-muted-foreground">Quantity to Buy</Label>
                  <Input
                    id={`quantity-${name.replace(/\s+/g, '-')}`}
                    type="number"
                    placeholder="e.g., 1,000,000"
                    value={purchaseQuantity === null ? '' : purchaseQuantity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value.replace(/,/g, ''));
                      setPurchaseQuantity(isNaN(val) || val < 0 ? null : val);
                    }}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`sellPrice-${name.replace(/\s+/g, '-')}`} className="text-xs text-muted-foreground">Est. Sell Price ($)</Label>
                  <Input
                    id={`sellPrice-${name.replace(/\s+/g, '-')}`}
                    type="number"
                    placeholder={formatPrice(coinData.exitPriceRange?.high)}
                    value={estimatedSellPrice === null ? '' : estimatedSellPrice}
                     onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setEstimatedSellPrice(isNaN(val) || val < 0 ? null : val);
                    }}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
              
              {purchaseQuantity !== null && purchaseQuantity > 0 && averageEntryPrice !== null && averageEntryPrice > 0 && totalBuyCost !== null && (
                 <div className="mt-2 text-center p-2 rounded-md bg-blue-500/10 border border-blue-500/30">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <ShoppingCart className="h-3 w-3 text-blue-400"/> Total Est. Buy Cost:
                    </p>
                    <p className="text-lg font-semibold text-blue-400">
                        {formatPrice(totalBuyCost)}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80">
                        (Buying {purchaseQuantity.toLocaleString()} @ avg. {formatPrice(averageEntryPrice)}/unit)
                    </p>
                </div>
              )}

              {calculatedProfit !== null && (
                <div className={`mt-1 text-center p-3 rounded-md ${calculatedProfit >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <p className="text-xs text-muted-foreground">Est. Quick Flip Profit:</p>
                  <p className={`text-xl font-bold ${calculatedProfit >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                    {formatPrice(calculatedProfit)}
                  </p>
                </div>
              )}
               <p className="text-[10px] text-muted-foreground/60 text-center pt-1">
                This estimator is for illustrative purposes only. Actual profits or losses can vary significantly due to extreme volatility.
              </p>
            </div>
          </>
        )}

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
                  {rationale}
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
                            {strategy.targetSellPrices && strategy.targetSellPrices.length > 0 && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium text-red-400">Target Sells:</span> {strategy.targetSellPrices.map(p => formatPrice(p)).join(', ')}</p>}
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

    