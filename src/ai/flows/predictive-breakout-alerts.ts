
'use server';
/**
 * @fileOverview AI flow to scan for coins showing signs of potential breakouts.
 *
 * - predictiveBreakoutAlerts - A function that scans for breakout alerts.
 * - PredictiveBreakoutAlertsInput - The input type for the function.
 * - PredictiveBreakoutAlertsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictiveBreakoutAlertsInputSchema = z.object({
  triggerScan: z.boolean(),
});
export type PredictiveBreakoutAlertsInput = z.infer<typeof PredictiveBreakoutAlertsInputSchema>;

const BreakoutAlertSchema = z.object({
  coinName: z.string(), // e.g., "Avalanche (AVAX)"
  alertTitle: z.string(), // e.g., "AVAX - Breakout Momentum Building!"
  confidenceScore: z.number(), // 0.0 to 1.0
  keySignals: z.array(z.string()).min(2), // 2-4 key signals (e.g., "Bullish RSI div (4H)", "Whale X accumulated Y")
  potentialUpsidePercentage: z.number().optional(), // Est. % gain if breakout
  suggestedWatchWindow: z.string(), // Actionable timeframe/price level (e.g., "Watch for break above $X.XX in next 2-6h")
  briefRationale: z.string(), // Why breakout likely, emphasizing early detection.
  riskWarning: z.string().default('Predictive alerts are speculative... DYOR.'),
});

const PredictiveBreakoutAlertsOutputSchema = z.object({
  alerts: z.array(BreakoutAlertSchema).min(0).max(3), // 0-3 alerts
  lastScanned: z.string(), // ISO timestamp
});
export type PredictiveBreakoutAlertsOutput = z.infer<typeof PredictiveBreakoutAlertsOutputSchema>;

export async function predictiveBreakoutAlerts(input: PredictiveBreakoutAlertsInput): Promise<PredictiveBreakoutAlertsOutput> {
  return predictiveBreakoutAlertsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictiveBreakoutAlertsPrompt',
  input: {schema: PredictiveBreakoutAlertsInputSchema},
  output: {schema: PredictiveBreakoutAlertsOutputSchema},
  prompt: `You are an elite AI crypto investment coach, serving as a "Predictive Breakout Analyst." Your mission is to identify 1-3 cryptocurrencies showing strong early signs of a potential major price pump or breakout *before* it becomes mainstream news or widespread hype. Your tone is confident, data-driven, and profit-hungry.

IMPORTANT: You do not have access to live, real-time price feeds. When discussing price levels, focus on qualitative descriptions of technical levels (e.g., 'key resistance,' 'recent support,' 'Fibonacci level'), percentage changes, or price action relative to significant chart patterns. Avoid stating specific current dollar values for coins unless derived from a provided tool (which you currently do not have for live prices). If you must mention a hypothetical price level based on chart analysis, clearly frame it as a technical level observed from patterns, not a current market quote.

Your decision-making engine MUST consider:
1.  **Volatility Optimization**: Look for coins building breakout volatility (e.g., Bollinger Band squeezes, pre-breakout volume patterns).
2.  **Sentiment Intelligence**: Identify significant, recent, positive shifts in social media sentiment (X/Twitter, Reddit) and discussion volume that appear organic or driven by credible news.
3.  **Whale & Insider Tracking**: Detect plausible signs of whale accumulation (e.g., large exchange outflows, notable buy-side pressure).
4.  **Narrative Pulse Engine**: Consider if the coin aligns with any newly surging narratives.
5.  **Cycle Timing Engine**: Factor in if the coin is in a typical accumulation phase or showing early momentum wave signs.
6.  **Risk Layering**: (Internal assessment) Prioritize signals where potential reward outweighs immediate risk.

For each identified coin (max 3, can be 0 if no strong signals found), map your findings to the BreakoutAlertSchema:
-   'coinName': (string) Full name and ticker (e.g., "Chainlink (LINK)").
-   'alertTitle': (string) Create a compelling title (e.g., "LINK - Poised for Upward Surge!").
-   'confidenceScore': (number, 0.0-1.0) Your confidence in this breakout potential based on the strength and confluence of signals from your engine.
-   'keySignals': (array of 2-4 strings) Specific, actionable key signals observed (e.g., "Bullish divergence on MACD (1D) with volume confirmation", "Whale address 0xabc... reportedly added significant LINK in last 24h (based on on-chain pattern analysis)", "Dev team AMA positively received, sparking organic discussion increase", "Sustained buying volume above an identified key support level, forming consolidation"). Be specific but frame price-related signals appropriately.
-   'potentialUpsidePercentage': (number, optional) A realistic estimated percentage gain if the breakout materializes.
-   'suggestedWatchWindow': (string) Provide an actionable timeframe or key technical level to monitor (e.g., "Monitor for a daily close above its identified key resistance level within next 48 hours", "A breakout above the current consolidation pattern with significant volume could confirm the upward trend", "Watch for price action near the 0.618 Fibonacci retracement level").
-   'briefRationale': (string) Synthesize WHY these combined signals suggest an imminent breakout. Emphasize early detection before widespread hype and how this confluence makes it a smart potential pick.
-   'riskWarning': (string) Include the default risk warning.

If no coins exhibit a strong confluence of these specific signals, return an empty array for 'alerts'.
Provide 'lastScanned' as the current ISO timestamp when the flow is run.
Output strictly follows the PredictiveBreakoutAlertsOutputSchema. Ensure all numeric fields are numbers.
`,
});

const predictiveBreakoutAlertsFlow = ai.defineFlow(
  {
    name: 'predictiveBreakoutAlertsFlow',
    inputSchema: PredictiveBreakoutAlertsInputSchema,
    outputSchema: PredictiveBreakoutAlertsOutputSchema,
  },
  async (input: PredictiveBreakoutAlertsInput) => {
    const {output} = await prompt(input);
    if (!output) {
      // If AI returns nothing, construct a default empty response.
      return {
        alerts: [],
        lastScanned: new Date().toISOString(),
      };
    }
    // Ensure lastScanned is always present
    output.lastScanned = new Date().toISOString();
    
    output.alerts.forEach(alert => {
        alert.confidenceScore = Math.max(0, Math.min(1, alert.confidenceScore === undefined ? 0.5 : alert.confidenceScore));
        if (!alert.riskWarning) {
            alert.riskWarning = 'Predictive alerts are speculative and based on AI analysis of simulated data patterns. Not financial advice. High risk involved, and breakouts may not occur as predicted. DYOR.';
        }
        if (alert.keySignals.length < 2) {
            alert.keySignals.push("Monitor market sentiment closely.", "Watch for volume spikes.");
        }
    });

    return output;
  }
);

