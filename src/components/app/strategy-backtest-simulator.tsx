
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingDots } from '@/components/ui/loading-dots';
import { PlayCircle, BarChart2, Clock, AlertTriangle, Info, Lightbulb, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type AiCoachStrategiesOutput } from '@/ai/flows/ai-coach-strategies';
import { simulateStrategyBacktest, type SimulateStrategyBacktestInput, type SimulateStrategyBacktestOutput } from '@/ai/flows/simulate-strategy-backtest';
import { Separator } from '../ui/separator';

type InvestmentStrategyForSim = AiCoachStrategiesOutput['investmentStrategies'][0];

interface StrategyBacktestSimulatorProps {
  coinName: string;
  strategy: InvestmentStrategyForSim;
  className?: string;
}

type BacktestPeriod = '7d' | '30d' | '90d';

export function StrategyBacktestSimulator({ coinName, strategy, className }: StrategyBacktestSimulatorProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<BacktestPeriod>('30d');
  const [simulationResult, setSimulationResult] = useState<SimulateStrategyBacktestOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    setIsLoading(true);
    setError(null);
    setSimulationResult(null);

    if (!strategy.optimalBuyPrice || !strategy.targetSellPrices || strategy.targetSellPrices.length === 0) {
        setError("Strategy is missing key details (optimal buy price or target sell prices) for simulation.");
        setIsLoading(false);
        return;
    }

    const input: SimulateStrategyBacktestInput = {
      coinName,
      backtestPeriod: selectedPeriod,
      strategyToSimulate: {
        name: strategy.name,
        optimalBuyPrice: strategy.optimalBuyPrice,
        targetSellPrices: strategy.targetSellPrices,
        stopLossSuggestion: strategy.stopLossSuggestion,
      },
    };

    try {
      const result = await simulateStrategyBacktest(input);
      setSimulationResult(result);
    } catch (err) {
      console.error("Error running simulation:", err);
      setError(err instanceof Error ? err.message : "Failed to run simulation.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const getOutcomeIcon = (outcome: SimulateStrategyBacktestOutput['performanceOutcome'] | undefined) => {
    switch (outcome) {
      case 'Profitable': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Loss-making': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'Breakeven': return <BarChart2 className="h-5 w-5 text-yellow-500" />;
      default: return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };


  return (
    <div className={cn("p-4 border border-border/50 rounded-lg bg-card/30 mt-4", className)}>
      <h4 className="text-md font-semibold text-accent mb-3 flex items-center">
        <PlayCircle className="h-5 w-5 mr-2" />
        Strategy Backtest Simulator
      </h4>
      
      <Alert variant="default" className="mb-4 text-xs bg-background/40 border-primary/30">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary/90">Simulation Disclaimer</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          This tool simulates strategy performance against AI-generated plausible historical scenarios, NOT actual market data. Results are hypothetical and for educational purposes only.
        </AlertDescription>
      </Alert>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-1">Select Simulation Period:</p>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as BacktestPeriod[]).map(period => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className={cn("text-xs", selectedPeriod === period ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'border-muted-foreground/50')}
            >
              <Clock className="h-3 w-3 mr-1.5" /> Past {period}
            </Button>
          ))}
        </div>
      </div>

      <Button onClick={handleRunSimulation} disabled={isLoading} className="w-full bg-primary hover:bg-primary/80">
        {isLoading ? <LoadingDots /> : <><BarChart2 className="mr-2 h-4 w-4" /> Run Simulated Backtest</>}
      </Button>
      <Button variant="outline" className="w-full mt-2 text-xs border-dashed border-muted-foreground/50 text-muted-foreground" disabled>
         <Lightbulb className="mr-2 h-4 w-4" /> Auto-Adjust Strategy (Coming Soon)
      </Button>


      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Simulation Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {simulationResult && !isLoading && (
        <div className="mt-6 space-y-4 p-4 rounded-md bg-background/50 border border-border/30">
          <h5 className="text-lg font-semibold text-primary-foreground">{simulationResult.simulationTitle}</h5>
          
          <div className="flex items-center gap-2 p-3 rounded-md bg-card/50 border border-border/40">
            {getOutcomeIcon(simulationResult.performanceOutcome)}
            <span className="text-md font-medium">
              Outcome: <span className={cn(
                simulationResult.performanceOutcome === 'Profitable' && 'text-green-400',
                simulationResult.performanceOutcome === 'Loss-making' && 'text-red-400',
                simulationResult.performanceOutcome === 'Breakeven' && 'text-yellow-400',
              )}>{simulationResult.performanceOutcome}</span>
            </span>
            {typeof simulationResult.simulatedProfitLossPercentage === 'number' && (
              <span className={cn(
                "ml-auto text-lg font-bold",
                 simulationResult.simulatedProfitLossPercentage > 0 && 'text-green-500',
                 simulationResult.simulatedProfitLossPercentage < 0 && 'text-red-500',
                 simulationResult.simulatedProfitLossPercentage === 0 && 'text-yellow-500',
              )}>
                {simulationResult.simulatedProfitLossPercentage >= 0 ? '+' : ''}
                {simulationResult.simulatedProfitLossPercentage.toFixed(2)}%
              </span>
            )}
          </div>

          <div>
            <h6 className="text-sm font-medium text-muted-foreground mb-1">Simulation Narrative:</h6>
            <p className="text-sm text-primary-foreground/80 whitespace-pre-line bg-card/20 p-3 rounded-md border border-border/20">{simulationResult.simulationNarrative}</p>
          </div>

          {simulationResult.keyEvents && simulationResult.keyEvents.length > 0 && (
            <div>
              <h6 className="text-sm font-medium text-muted-foreground mb-1">Key Simulated Events:</h6>
              <ul className="list-disc list-inside text-xs text-primary-foreground/70 space-y-1 pl-4 bg-card/20 p-3 rounded-md border border-border/20">
                {simulationResult.keyEvents.map((event, index) => <li key={index}>{event}</li>)}
              </ul>
            </div>
          )}
           <Separator className="my-3 border-border/30" />
           <Alert variant="default" className="text-xs bg-background/30 border-amber-500/30">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-400">Disclaimer</AlertTitle>
                <AlertDescription className="text-muted-foreground/80">{simulationResult.importantDisclaimer}</AlertDescription>
            </Alert>
        </div>
      )}
    </div>
  );
}

    