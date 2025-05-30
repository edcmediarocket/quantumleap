"use client";

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
} from "@/components/ui/dialog";
import { TrendingUp, HelpCircle, Gauge, Target, Clock, DollarSign, Info } from "lucide-react";
import type { AiCoinPicksOutput } from "@/ai/flows/ai-coin-picks";
import type { RecommendCoinsForProfitTargetOutput } from "@/ai/flows/quick-profit-goal";

type CoinPick = AiCoinPicksOutput['picks'][0];
type ProfitCoin = RecommendCoinsForProfitTargetOutput['recommendedCoins'][0];

interface CoinCardProps {
  coinData: CoinPick | ProfitCoin;
  type: 'aiPick' | 'profitGoal';
}

function isAiPick(coinData: CoinPick | ProfitCoin, type: 'aiPick' | 'profitGoal'): coinData is CoinPick {
  return type === 'aiPick';
}

export function CoinCard({ coinData, type }: CoinCardProps) {
  const name = isAiPick(coinData, type) ? coinData.coin : coinData.coinName;
  const gain = isAiPick(coinData, type) ? coinData.predictedGainPercentage : coinData.estimatedGain;
  const confidence = isAiPick(coinData, type) ? coinData.confidenceMeter : coinData.tradeConfidence;

  return (
    <GlassCardRoot>
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <GlassCardTitle>{name}</GlassCardTitle>
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-6 w-6" />
            <span className="text-lg font-semibold">{gain.toFixed(2)}%</span>
          </div>
        </div>
      </GlassCardHeader>
      <GlassCardContent>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Entry Price:</p>
          <p className="font-medium text-foreground">{coinData.entryPriceRange}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Exit Price:</p>
          <p className="font-medium text-foreground">{coinData.exitPriceRange}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Confidence:</p>
          <Progress value={confidence * 100} className="h-2 w-full bg-primary/20 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary" />
        </div>
        {coinData.estimatedDuration && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p>Est. Duration: {coinData.estimatedDuration}</p>
          </div>
        )}
        {isAiPick(coinData, type) && coinData.riskRoiGauge !== undefined && (
          <div className="group relative">
            <p className="text-xs text-muted-foreground mb-1 flex items-center">
              Risk/ROI Gauge
              <Info className="h-3 w-3 ml-1 text-muted-foreground group-hover:text-accent transition-colors" />
            </p>
            <Progress value={coinData.riskRoiGauge * 100} className="h-2 w-full bg-primary/20 [&>div]:bg-gradient-to-r [&>div]:from-yellow-500 [&>div]:to-red-500" />
            <div className="absolute bottom-full left-0 mb-2 hidden w-max transform items-center rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-lg group-hover:flex">
              Indicates risk vs. reward. Higher means higher potential reward but also higher risk.
            </div>
          </div>
        )}
         <div className="pt-2">
            <p className="text-xs text-muted-foreground">Chart Preview:</p>
            <div className="mt-1 flex h-20 items-center justify-center rounded-md border border-dashed border-border/50 bg-background/30 text-sm text-muted-foreground">
              Trading Chart Placeholder
            </div>
          </div>
      </GlassCardContent>
      <GlassCardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              <HelpCircle className="mr-2 h-4 w-4" /> Why This Coin?
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-popover text-popover-foreground glass-effect !rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-primary">AI Rationale for {name}</DialogTitle>
              <DialogDescription className="text-muted-foreground pt-2">
                Here's why our AI thinks this coin is a promising pick:
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-sm leading-relaxed">
              {coinData.rationale}
            </div>
          </DialogContent>
        </Dialog>
      </GlassCardFooter>
    </GlassCardRoot>
  );
}
