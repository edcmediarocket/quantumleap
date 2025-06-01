
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { LoadingDots } from '@/components/ui/loading-dots';
import { Zap, TrendingUp, Activity, ShieldAlert, Clock, MessageSquare, TargetIcon, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { predictiveBreakoutAlerts, type PredictiveBreakoutAlertsOutput } from '@/ai/flows/predictive-breakout-alerts';
import { GlassCardRoot } from './glass-card';
import { useToast } from '@/hooks/use-toast';
import type { ActiveTabType } from '@/app/page'; // Import ActiveTabType

interface PredictiveBreakoutAlertsPanelProps {
  activeTab: ActiveTabType;
}

export function PredictiveBreakoutAlertsPanel({ activeTab }: PredictiveBreakoutAlertsPanelProps) {
  const [alertsOutput, setAlertsOutput] = useState<PredictiveBreakoutAlertsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleScanForAlerts = async () => {
    setIsLoading(true);
    setError(null);
    setAlertsOutput(null);
    try {
      const result = await predictiveBreakoutAlerts({ triggerScan: true });
      setAlertsOutput(result);
      if (!result.alerts || result.alerts.length === 0) {
        toast({
            title: "Breakout Scan Complete",
            description: "No high-probability breakout signals detected at this moment. The market is currently stable or signals are not strong enough.",
            variant: "default",
        });
      }
    } catch (err) {
      console.error("Error fetching breakout alerts:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch breakout alerts.";
      setError(errorMessage);
      toast({
        title: "Scan Error",
        description: `Could not fetch breakout alerts: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score > 0.75) return 'bg-green-500/20 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-green-600';
    if (score > 0.5) return 'bg-yellow-500/20 [&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-yellow-600';
    return 'bg-orange-500/20 [&>div]:bg-gradient-to-r [&>div]:from-orange-400 [&>div]:to-red-500';
  };

  const panelGlowClass = 
    activeTab === 'profitGoal' ? 'default-glow-accent' :
    activeTab === 'memeFlip' ? 'default-glow-orange' :
    'default-glow-primary';

  const alertItemGlowClass = panelGlowClass; // Make alert items match the panel's glow

  return (
    <section className="my-12">
      <GlassCardRoot className={cn("glass-effect glass-effect-interactive-hover w-full max-w-4xl mx-auto p-6 md:p-8", panelGlowClass)}>
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center mb-4 sm:mb-0">
            <Zap className="h-8 w-8 mr-3" />
            Predictive Breakout Alerts
          </h2>
          <Button onClick={handleScanForAlerts} disabled={isLoading} size="lg" className="bg-primary hover:bg-primary/90">
            {isLoading ? <LoadingDots /> : <><Activity className="mr-2 h-5 w-5" /> Scan for Opportunities</>}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6 text-center sm:text-left">
          AI scans for coins showing bullish divergence, social spikes, and whale accumulation to flag potential pre-pump breakouts.
        </p>

        {isLoading && <div className="flex justify-center my-8"><LoadingDots size="lg" /></div>}

        {error && (
          <Alert variant="destructive" className="my-4">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Scan Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {alertsOutput && !isLoading && alertsOutput.alerts.length === 0 && !error && (
          <div className="text-center py-10 text-muted-foreground bg-card/30 rounded-lg p-6">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-primary/50" />
            <h3 className="text-xl font-semibold mb-2">No Strong Breakout Signals Detected</h3>
            <p className="text-sm">The AI didn't find any coins with a high confluence of breakout signals in the current (simulated) scan. Markets might be consolidating, or early signals are not yet strong enough. Try scanning again later.</p>
            {alertsOutput.lastScanned && <p className="text-xs mt-3">Last scan: {new Date(alertsOutput.lastScanned).toLocaleString()}</p>}
          </div>
        )}

        {alertsOutput && alertsOutput.alerts.length > 0 && !isLoading && (
          <div className="space-y-6">
            <p className="text-xs text-center text-muted-foreground">
                Last scan: {new Date(alertsOutput.lastScanned).toLocaleString()}. Alerts are based on AI's analysis of simulated market patterns.
            </p>
            {alertsOutput.alerts.map((alert, index) => (
              <div key={index} className={cn(
                "p-5 rounded-lg border border-border/40 bg-card/50 shadow-lg transition-all duration-300",
                "glass-effect glass-effect-interactive-hover",
                alertItemGlowClass 
              )}>
                <AlertTitle className="text-xl font-semibold text-primary flex items-center mb-2"> 
                  <TrendingUp className="h-6 w-6 mr-2" /> {alert.alertTitle}
                </AlertTitle>
                
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">AI Confidence: { (alert.confidenceScore * 100).toFixed(0) }%</p>
                  <Progress value={alert.confidenceScore * 100} className={`h-2 w-full ${getConfidenceColor(alert.confidenceScore)}`} />
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                        <h4 className="font-medium text-primary-foreground/80 mb-1 flex items-center"><Activity className="h-4 w-4 mr-1.5 text-primary/70" />Key Signals:</h4>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4 text-xs">
                        {alert.keySignals.map((signal, i) => <li key={i}>{signal}</li>)}
                        </ul>
                    </div>
                    <div>
                        {alert.potentialUpsidePercentage && (
                        <p className="mb-1"><TargetIcon className="inline h-4 w-4 mr-1.5 text-green-400" /> <span className="font-medium text-primary-foreground/80">Potential Upside:</span> <span className="text-green-400 font-semibold">~{alert.potentialUpsidePercentage.toFixed(1)}%</span></p>
                        )}
                        <p><Clock className="inline h-4 w-4 mr-1.5 text-blue-400" /> <span className="font-medium text-primary-foreground/80">Watch Window:</span> <span className="text-muted-foreground">{alert.suggestedWatchWindow}</span></p>
                    </div>
                </div>
                
                <div className="mb-3">
                    <h4 className="font-medium text-primary-foreground/80 mb-1 flex items-center"><MessageSquare className="h-4 w-4 mr-1.5 text-purple-400" />AI Rationale:</h4>
                    <p className="text-xs text-muted-foreground italic bg-background/30 p-2 rounded-md border border-border/20">{alert.briefRationale}</p>
                </div>
                
                <Alert variant="default" className="text-xs bg-background/20 border-amber-500/30">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-amber-400 text-xs">Risk Warning</AlertTitle>
                  <AlertDescription className="text-muted-foreground/80">{alert.riskWarning}</AlertDescription>
                </Alert>
              </div>
            ))}
          </div>
        )}
      </GlassCardRoot>
    </section>
  );
}

