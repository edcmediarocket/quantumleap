
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, HelpCircle, Gauge, Target, Clock, DollarSign, Info, Brain, Terminal, RocketIcon, AlertTriangle, Calculator, TimerIcon, BellIcon, ShoppingCart, LineChart, ShieldCheck, Zap, TrendingDown, BarChartBig, PlayCircle, Award, StarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import type { AiCoinPicksOutput, AiCoinPicksInput } from "@/ai/flows/ai-coin-picks";
import type { RecommendCoinsForProfitTargetOutput } from "@/ai/flows/quick-profit-goal";
import type { MemeCoinQuickFlipOutput } from "@/ai/flows/meme-coin-quick-flip";
import { aiCoachStrategies, type AiCoachStrategiesInput, type AiCoachStrategiesOutput } from "@/ai/flows/ai-coach-strategies";
import { StrategyBacktestSimulator } from "./strategy-backtest-simulator";

type AiPick = AiCoinPicksOutput['picks'][0];
type ProfitGoalCoin = RecommendCoinsForProfitTargetOutput['recommendedCoins'][0];
type MemeFlipCoin = MemeCoinQuickFlipOutput['picks'][0];
type InvestmentStrategyFromAICoach = AiCoachStrategiesOutput['investmentStrategies'][0];


type AnyCoinData = AiPick | ProfitGoalCoin | MemeFlipCoin;
type PriceRange = { low: number; high: number };
type TradingStyle = 'short-term' | 'swing' | 'scalp';
type RiskProfile = AiCoinPicksInput['riskProfile'];
export type CoinCardType = 'aiPick' | 'profitGoal' | 'memeFlip';


interface CoinCardProps {
  coinData: AnyCoinData;
  type: CoinCardType;
  profitTarget?: number;
  riskTolerance?: 'low' | 'medium' | 'high';
  investmentAmount?: number;
  riskProfile?: RiskProfile;
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

  const absPrice = Math.abs(price);

  if (absPrice >= 1) {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    let priceStr = price.toFixed(20);
    priceStr = priceStr.replace(/0+$/, "");
    if (priceStr.endsWith('.')) {
      priceStr = priceStr.slice(0, -1);
    }
    if (priceStr === "0") {
      return "$0.00";
    }
    const parts = priceStr.split('.');
    if (parts.length === 2) {
      const integerPart = parts[0];
      const decimalPart = parts[1];
      if (integerPart === "0") {
        if (absPrice >= 0.01 && decimalPart.length < 2) {
          priceStr = `${integerPart}.${decimalPart.padEnd(2, '0')}`;
        }
      }
    }
    return `$${priceStr}`;
  }
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


export function CoinCard({ coinData, type, profitTarget, riskTolerance, investmentAmount, riskProfile }: CoinCardProps) {
  let name: string;
  let gain: number;
  let confidence: number | undefined;
  let riskRoiGaugeValue: number | undefined;
  let riskMatchScoreValue: number | undefined;
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

  const [unitsToBuyForGoal, setUnitsToBuyForGoal] = useState<number | null>(null);
  const [requiredSellPriceForGoal, setRequiredSellPriceForGoal] = useState<number | null>(null);
  const [potentialTotalValueForGoal, setPotentialTotalValueForGoal] = useState<number | null>(null);

  if (isAiPick(coinData, type)) {
    name = coinData.coin;
    gain = coinData.predictedGainPercentage;
    confidence = coinData.confidenceMeter;
    riskRoiGaugeValue = coinData.riskRoiGauge;
    riskMatchScoreValue = coinData.riskMatchScore;
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
    riskRoiGaugeValue = coinData.riskRoiGauge;
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
    riskRoiGaugeValue = 0.5;
    riskMatchScoreValue = 0.5;
    rationale = "No rationale available.";
  }

  useEffect(() => {
    if (entryPriceRange?.low && entryPriceRange?.high) {
      const avgEntry = (entryPriceRange.low + entryPriceRange.high) / 2;
      setAverageEntryPrice(avgEntry > 0 ? avgEntry : entryPriceRange.low);
    } else if (entryPriceRange?.low) {
       setAverageEntryPrice(entryPriceRange.low);
    } else {
      setAverageEntryPrice(null);
    }
  }, [entryPriceRange]);

  useEffect(() => {
    if (type === 'memeFlip' && purchaseQuantity !== null && averageEntryPrice !== null && purchaseQuantity > 0 && averageEntryPrice > 0) {
      setTotalBuyCost(purchaseQuantity * averageEntryPrice);
      if (estimatedSellPrice !== null && estimatedSellPrice >= 0) {
        const totalRevenue = purchaseQuantity * estimatedSellPrice;
        setCalculatedProfit(totalRevenue - (purchaseQuantity * averageEntryPrice));
      } else {
        setCalculatedProfit(null);
      }
    } else if (type === 'memeFlip') {
      setTotalBuyCost(null);
      setCalculatedProfit(null);
    }
  }, [purchaseQuantity, estimatedSellPrice, averageEntryPrice, type]);

  useEffect(() => {
    if (type === 'profitGoal' && investmentAmount && profitTarget && averageEntryPrice && averageEntryPrice > 0) {
      const units = investmentAmount / averageEntryPrice;
      setUnitsToBuyForGoal(units);
      if (units > 0) {
        setRequiredSellPriceForGoal((investmentAmount + profitTarget) / units);
      } else {
        setRequiredSellPriceForGoal(null);
      }
      setPotentialTotalValueForGoal(investmentAmount + profitTarget);
    } else if (type === 'profitGoal') {
      setUnitsToBuyForGoal(null);
      setRequiredSellPriceForGoal(null);
      setPotentialTotalValueForGoal(null);
    }
  }, [type, investmentAmount, profitTarget, averageEntryPrice]);

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
  const [currentTradingStylePreference, setCurrentTradingStylePreference] = useState<TradingStyle | null>(null);

  const canShowCoach = type === 'aiPick' || type === 'profitGoal' || type === 'memeFlip';

  const fetchCoachStrategies = async (stylePref: TradingStyle | null = null) => {
    if (!canShowCoach) return;
    setIsLoadingCoach(true);
    setCoachError(null);
    setCoachStrategies(null); 

    try {
      if (!entryPriceRange || typeof entryPriceRange.low !== 'number' || typeof entryPriceRange.high !== 'number' ||
          !exitPriceRange || typeof exitPriceRange.low !== 'number' || typeof exitPriceRange.high !== 'number') {
        const errorMsg = "Client Error: Entry or exit price range is incomplete or invalid for AI Coach. Check low/high values.";
        console.error(errorMsg, { coinName: name, entryPriceRange, exitPriceRange });
        setCoachError(errorMsg);
        return;
      }

      let coachInput: AiCoachStrategiesInput = {
        coinName: name,
        currentRationale: rationale,
        predictedGainPercentage: gain,
        entryPriceRange: entryPriceRange,
        exitPriceRange: exitPriceRange,
        estimatedDuration: estimatedDuration || "Short-term",
      };

      if (type === 'aiPick' && riskProfile) {
         if (riskProfile === 'cautious') coachInput.riskTolerance = 'low';
         else if (riskProfile === 'balanced') coachInput.riskTolerance = 'medium';
         else if (riskProfile === 'aggressive') coachInput.riskTolerance = 'high';
      } else if (type === 'profitGoal' && riskTolerance) {
        coachInput.riskTolerance = riskTolerance;
      } else if (type === 'memeFlip') {
        coachInput.riskTolerance = 'high';
        if (!coachInput.estimatedDuration) coachInput.estimatedDuration = "Few hours to 2 days";
      }

      if (profitTarget) coachInput.profitTarget = profitTarget;

      if (stylePref) {
        coachInput.tradingStylePreference = stylePref;
      }
      
      console.log(`Attempting to fetch AI coach strategies for ${name} with input:`, JSON.stringify(coachInput, null, 2));

      const result = await aiCoachStrategies(coachInput);
      setCoachStrategies(result);
    } catch (error) {
      let detailedErrorMessage = "An unknown error occurred.";
      if (error instanceof Error) {
        detailedErrorMessage = error.message;
      } else if (typeof error === 'string') {
        detailedErrorMessage = error;
      } else if (error && typeof error === 'object' && 'toString' in error) {
        detailedErrorMessage = error.toString();
      }
      
      console.error(`Error fetching AI coach strategies for ${name}. Detail:`, detailedErrorMessage, "Raw error object:", error);
      setCoachError(`Failed to fetch AI coach strategies: ${detailedErrorMessage}`);
    } finally {
      setIsLoadingCoach(false);
    }
  };

  useEffect(() => {
    if (isDialogOpen && canShowCoach && !coachStrategies && !isLoadingCoach && !coachError) {
        fetchCoachStrategies(currentTradingStylePreference);
    }
  }, [isDialogOpen, canShowCoach, coachStrategies, isLoadingCoach, coachError, currentTradingStylePreference, name, rationale, gain, entryPriceRange, exitPriceRange, estimatedDuration, profitTarget, riskTolerance, riskProfile, type]);


  const handleTradingStyleSelect = (style: TradingStyle) => {
    setCurrentTradingStylePreference(style);
    fetchCoachStrategies(style); 
  };


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

  const cardTitleColor =
      type === 'aiPick' ? 'text-primary group-hover:text-primary transition-colors'
    : type === 'profitGoal' ? 'text-accent group-hover:text-accent transition-colors'
    : type === 'memeFlip' ? 'text-[hsl(var(--orange-hsl))] group-hover:text-[hsl(var(--orange-hsl))] transition-colors'
    : 'text-primary-foreground group-hover:text-primary transition-colors';


  const gainColor = gain >= 0 ? (type === 'memeFlip' ? 'text-yellow-400' : 'text-green-400') : 'text-red-400';

  const getRiskBasedProgressBg = (score: number | undefined, forRiskProfile: RiskProfile | undefined) => {
    if (score === undefined) return 'bg-muted';
    if (score >= 0.7) return 'bg-green-500/20 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-green-600';
    if (score >= 0.4) return 'bg-yellow-500/20 [&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-yellow-600';
    return 'bg-red-500/20 [&>div]:bg-gradient-to-r [&>div]:from-red-400 [&>div]:to-red-600';
  };

  const riskRoiProgressClass = getRiskBasedProgressBg(riskRoiGaugeValue, undefined);
  const riskMatchProgressClass = getRiskBasedProgressBg(riskMatchScoreValue, riskProfile);

  const confidenceProgressBg =
      type === 'aiPick' ? 'bg-primary/20 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary'
    : type === 'profitGoal' ? 'bg-accent/20 [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-accent'
    : type === 'memeFlip' ? 'bg-orange-500/20 [&>div]:bg-gradient-to-r [&>div]:from-yellow-500 [&>div]:to-red-500'
    : 'bg-primary/20 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary';

  const dialogButtonVariant = type === 'memeFlip' ? 'outline' : 'outline';
  const dialogButtonTextColor =
      type === 'aiPick' ? 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
    : type === 'profitGoal' ? 'border-accent text-accent hover:bg-accent hover:text-accent-foreground'
    : type === 'memeFlip' ? 'border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'
    : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground';

  const dialogTitleIcon = type === 'memeFlip' ? <RocketIcon className="h-6 w-6"/> : <Brain className="h-6 w-6"/>;
  const dialogTitleText = `AI Analysis & Strategies for ${name}`;
  const dialogDescriptionText = type === 'memeFlip' ? `Speculative insights and coaching strategies for this meme coin. EXTREME RISK!` : `Detailed insights and coaching strategies powered by AI.`;

  const defaultCardGlowClass =
      type === 'aiPick' ? 'default-glow-primary'
    : type === 'profitGoal' ? 'default-glow-accent'
    : type === 'memeFlip' ? 'default-glow-orange'
    : 'default-glow-primary'; 


  return (
    <GlassCardRoot className={cn(
      "glass-effect-interactive-hover",
      defaultCardGlowClass
    )}>
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

        { (isAiPick(coinData, type) || isProfitGoalCoin(coinData, type) || (isMemeFlipCoin(coinData, type))) &&
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
            <Progress value={confidence * 100} className={`h-2 w-full ${confidenceProgressBg}`} />
          </div>
        )}

        {isAiPick(coinData, type) && riskMatchScoreValue !== undefined && riskProfile && (
            <TooltipProvider>
                <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                    <div className="cursor-help">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center">
                        Risk Match ({riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)})
                        <ShieldCheck className="h-3 w-3 ml-1 text-muted-foreground group-hover:text-primary transition-colors" />
                    </p>
                    <Progress value={riskMatchScoreValue * 100} className={`h-2 w-full ${riskMatchProgressClass}`} />
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-center bg-popover text-popover-foreground p-2 rounded-md shadow-lg border">
                    <p className="text-xs">
                    AI-assessed alignment of this coin with your selected '{riskProfile}' risk profile. Higher score indicates a better match.
                    </p>
                </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )}

        {riskRoiGaugeValue !== undefined && (isAiPick(coinData, type) || isProfitGoalCoin(coinData, type)) && (
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center">
                    AI Risk/ROI Gauge
                    <Info className="h-3 w-3 ml-1 text-muted-foreground group-hover:text-accent transition-colors" />
                  </p>
                  <Progress value={riskRoiGaugeValue * 100} className={`h-2 w-full ${riskRoiProgressClass}`} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-center bg-popover text-popover-foreground p-2 rounded-md shadow-lg border">
                <p className="text-xs">
                  AI-Assessed Risk vs. Reward. Lower values suggest lower relative risk for the potential reward; higher values suggest higher risk. This is a speculative indicator based on AI analysis.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                    placeholder={formatPrice(exitPriceRange?.high)}
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

        {isProfitGoalCoin(coinData, type) && investmentAmount && profitTarget && averageEntryPrice && (
          <>
            <Separator className="my-3 border-accent/30" />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-accent flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Investment Scenario for Your Goal
              </h4>
              <p className="text-xs text-muted-foreground">
                With an investment of <span className="font-semibold text-foreground">{formatPrice(investmentAmount)}</span>:
              </p>
              {unitsToBuyForGoal !== null && unitsToBuyForGoal > 0 && (
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 pl-4">
                  <li>
                    You could potentially buy ~<span className="font-semibold text-foreground">{unitsToBuyForGoal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</span> units of {name}.
                  </li>
                  {requiredSellPriceForGoal !== null && (
                    <li>
                      To reach your <span className="font-semibold text-green-400">{formatPrice(profitTarget)}</span> profit target, the price per unit would need to hit ~<span className="font-semibold text-foreground">{formatPrice(requiredSellPriceForGoal)}</span>.
                    </li>
                  )}
                </ul>
              )}
              {potentialTotalValueForGoal !== null && (
                 <div className="mt-2 text-center p-2 rounded-md bg-green-500/10 border border-green-500/30">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <LineChart className="h-3 w-3 text-green-400"/> Potential Total Value:
                    </p>
                    <p className="text-lg font-semibold text-green-400">
                        {formatPrice(potentialTotalValueForGoal)}
                    </p>
                     <p className="text-[10px] text-muted-foreground/80">
                        (Investment: {formatPrice(investmentAmount)} + Target Profit: {formatPrice(profitTarget)})
                    </p>
                </div>
              )}
              {estimatedDuration && (
                 <p className="text-xs text-muted-foreground text-center pt-1">
                    AI Est. Duration to reach target: <span className="font-semibold text-foreground">{estimatedDuration}</span>
                </p>
              )}
               <p className="text-[10px] text-muted-foreground/60 text-center pt-1">
                This scenario is illustrative, based on AI estimations & average entry. Market conditions can change rapidly.
              </p>
            </div>
          </>
        )}

      </GlassCardContent>
      <GlassCardFooter>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant={dialogButtonVariant} size="sm" className={`w-full ${dialogButtonTextColor}`}>
              <HelpCircle className="mr-2 h-4 w-4" /> {canShowCoach ? "Why This Coin & AI Coach" : "Why This Coin?"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-y-auto bg-popover text-popover-foreground glass-effect !rounded-xl">
            <DialogHeader>
              <DialogTitle className={`${type === 'memeFlip' ? 'text-orange-500' : type === 'profitGoal' ? 'text-accent' : 'text-primary'} flex items-center gap-2`}>
                {dialogTitleIcon} {dialogTitleText}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground pt-2 text-left">
                {dialogDescriptionText}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${type === 'memeFlip' ? 'text-orange-400' : type === 'profitGoal' ? 'text-accent' : 'text-primary'}`}>In-depth Rationale</h3>
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
                    <h3 className="text-lg font-semibold mb-3 text-accent flex items-center gap-2">
                      <Brain className="h-5 w-5" /> AI Coach Strategies
                    </h3>
                    <div className="mb-4 p-3 rounded-md bg-card/40 border border-border/30">
                        <h4 className="text-sm font-medium text-primary-foreground/80 mb-2">Refine Strategies by Trading Style:</h4>
                        <div className="flex gap-2 flex-wrap">
                            {(['short-term', 'swing', 'scalp'] as TradingStyle[]).map((style) => (
                                <Button
                                    key={style}
                                    variant={currentTradingStylePreference === style ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleTradingStyleSelect(style)}
                                    className={cn(
                                      "text-xs capitalize",
                                      currentTradingStylePreference === style ?
                                        (style === 'short-term' ? 'bg-blue-600 hover:bg-blue-700' : style === 'swing' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-teal-600 hover:bg-teal-700') :
                                        'border-muted-foreground/50 hover:bg-muted/50'
                                    )}
                                >
                                    {style === 'short-term' ? <Zap className="mr-1.5 h-3.5 w-3.5"/> : style === 'swing' ? <TrendingDown className="mr-1.5 h-3.5 w-3.5"/> : <BarChartBig className="mr-1.5 h-3.5 w-3.5"/>}
                                    {style.replace('-', ' ')}
                                </Button>
                            ))}
                             {currentTradingStylePreference && (
                                <Button variant="ghost" size="sm" onClick={() => {setCurrentTradingStylePreference(null); fetchCoachStrategies(null);}} className="text-xs text-muted-foreground hover:text-foreground">
                                    Clear Style
                                </Button>
                            )}
                        </div>
                    </div>

                    {isLoadingCoach && <div className="flex justify-center my-6"><LoadingDots size="lg"/></div>}
                    {coachError && (
                      <Alert variant="destructive" className="my-4">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Coaching Error</AlertTitle>
                        <AlertDescription>{coachError}</AlertDescription>
                      </Alert>
                    )}
                    {coachStrategies && !isLoadingCoach && (
                      <div className="space-y-4">
                        {coachStrategies.topPickRationale && (
                           <div className="p-4 rounded-lg bg-[hsla(var(--neon-green-soft-bg-hsl),0.05)] border default-glow-neon-green glass-effect-interactive-hover shadow-lg mb-6">
                            <div className="flex items-center gap-2 mb-2">
                               <StarIcon className="h-6 w-6 text-[hsl(var(--neon-green-base-hsl))] fill-[hsl(var(--neon-green-base-hsl))]" />
                              <h4 className="text-md font-semibold text-[hsl(var(--neon-green-base-hsl))]">AI's Top Strategy Rationale</h4>
                            </div>
                            <p className="text-sm text-foreground/90 italic">{coachStrategies.topPickRationale}</p>
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium text-primary-foreground/90">Coin-Specific Advice:</h4>
                          <p className="text-sm text-muted-foreground pl-2 border-l-2 border-accent ml-1 py-1 italic">{coachStrategies.coinSpecificAdvice}</p>
                        </div>

                        {coachStrategies.investmentStrategies.map((strategy: InvestmentStrategyFromAICoach, index: number) => (
                          <div key={index}
                               className={cn(
                                "p-3 rounded-md bg-card/50 border border-border/40 shadow-md space-y-3 glass-effect-interactive-hover",
                                strategy.isTopPick ? "default-glow-neon-green" : "border-border/40"
                               )}>
                            {strategy.isTopPick && (
                                <div className="absolute -top-3 -left-3 bg-[hsl(var(--neon-green-base-hsl))] text-[hsl(var(--neon-green-text-on-base-hsl))] p-1.5 rounded-full shadow-lg">
                                    <StarIcon className="h-5 w-5" />
                                </div>
                            )}
                            <div>
                                <h4 className={cn("font-semibold text-primary-foreground", strategy.isTopPick && "text-[hsl(var(--neon-green-base-hsl))]")}>{strategy.name} {strategy.isTopPick && "(Top Pick)"}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{strategy.description}</p>
                                {strategy.optimalBuyPrice && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium text-green-400">Optimal Buy:</span> {formatPrice(strategy.optimalBuyPrice)}</p>}
                                {strategy.targetSellPrices && strategy.targetSellPrices.length > 0 && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium text-red-400">Target Sells:</span> {strategy.targetSellPrices.map(p => formatPrice(p)).join(', ')}</p>}
                                <p className="text-xs text-muted-foreground mt-2"><span className="font-medium text-accent/90">Reasoning:</span> {strategy.reasoning}</p>
                                {strategy.tradingStyleAlignment && (
                                    <p className="text-xs text-purple-400 mt-1 italic"><span className="font-medium">Style Alignment:</span> {strategy.tradingStyleAlignment}</p>
                                )}
                                <div className="mt-2">
                                    <p className="text-xs font-medium text-primary-foreground/80 mb-1">Actionable Steps:</p>
                                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 pl-3">
                                    {strategy.actionableSteps.map((step, i) => <li key={i}>{step}</li>)}
                                    </ul>
                                </div>
                                {strategy.stopLossSuggestion && <p className="text-xs text-muted-foreground mt-2"><ShieldCheck className="inline h-3.5 w-3.5 mr-1 text-yellow-500"/> <span className="font-medium">Stop-Loss:</span> {strategy.stopLossSuggestion}</p>}
                            </div>
                            <StrategyBacktestSimulator
                                coinName={name}
                                strategy={strategy}
                                cardType={type} 
                            />
                          </div>
                        ))}
                         <div>
                          <h4 className="font-medium text-primary-foreground/90">Overall Outlook & Risk Management:</h4>
                          <p className="text-sm text-muted-foreground pl-2 border-l-2 border-accent ml-1 py-1 italic">{coachStrategies.overallCoachSOutlook}</p>
                        </div>
                        <p className="text-xs text-center text-muted-foreground/70 pt-2">{coachStrategies.disclaimer}</p>
                      </div>
                    )}
                     {!coachStrategies && !isLoadingCoach && !coachError && (
                        <div className="text-center py-6 text-muted-foreground">
                            Select a trading style or wait for AI strategies to load.
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
