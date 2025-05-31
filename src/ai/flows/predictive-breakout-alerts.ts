
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
  triggerScan: z.boolean().describe('A simple trigger to initiate the scan.'),
});
export type PredictiveBreakoutAlertsInput = z.infer<typeof PredictiveBreakoutAlertsInputSchema>;

const BreakoutAlertSchema = z.object({
  coinName: z.string().describe('The name and ticker of the coin (e.g., "Avalanche (AVAX)").'),
  alertTitle: z.string().describe('A catchy title for the alert (e.g., "AVAX - Breakout Momentum Building!").'),
  confidenceScore: z.number().min(0).max(1).describe('AI confidence in this breakout potential (0.0 to 1.0).'),
  keySignals: z.array(z.string()).min(2).describe('List of 2-4 key observed signals (e.g., "Bullish divergence on RSI (4H)", "Whale wallet X just accumulated Y tokens", "Social sentiment turned sharply positive in last hour").'),
  potentialUpsidePercentage: z.number().optional().describe('Estimated potential percentage gain if breakout materializes.'),
  suggestedWatchWindow: z.string().describe('Actionable timeframe or price level to monitor (e.g., "Watch for break above $X.XX in next 2-6 hours", "If volume confirms above Y, next target Z").'),
  briefRationale: z.string().describe('Short rationale explaining why a breakout is likely, emphasizing early detection before widespread hype. Highlight confluence of signals.'),
  riskWarning: z.string().default('Predictive alerts are speculative and based on AI analysis of simulated data patterns. Not financial advice. High risk involved, and breakouts may not occur as predicted. DYOR.').describe('Standard risk warning for this alert type.'),
});

const PredictiveBreakoutAlertsOutputSchema = z.object({
  alerts: z.array(BreakoutAlertSchema).min(0).max(3).describe('An array of 0 to 3 breakout alerts. If no strong signals, array can be empty.'),
  lastScanned: z.string().describe('Timestamp of when the scan was performed (ISO string).'),
});
export type PredictiveBreakoutAlertsOutput = z.infer<typeof PredictiveBreakoutAlertsOutputSchema>;

export async function predictiveBreakoutAlerts(input: PredictiveBreakoutAlertsInput): Promise<PredictiveBreakoutAlertsOutput> {
  return predictiveBreakoutAlertsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictiveBreakoutAlertsPrompt',
  input: {schema: PredictiveBreakoutAlertsInputSchema},
  output: {schema: PredictiveBreakoutAlertsOutputSchema},
  prompt: `You are an expert "Predictive Breakout Analyst" AI. Your primary goal is to identify 1-3 cryptocurrencies that are showing strong early signs of a potential major price pump or breakout *before* it becomes mainstream news or widespread hype.

Analyze the current (simulated) market conditions looking for a confluence of the following signals for each coin:
1.  **Bullish Volume Divergence:** Price making lower lows while an oscillator (like RSI or MACD) makes higher lows, often accompanied by increasing volume on up-moves or specific volume patterns indicating accumulation.
2.  **Social Media Trend Spikes:** A significant, recent, and positive shift in social media sentiment (e.g., on X/Twitter, Reddit) combined with a rapid increase in discussion volume for the coin. This should be organic-looking or driven by credible new information, not just random shilling.
3.  **Whale Wallet Accumulation:** Plausible signs of large wallet addresses (whales) accumulating the coin, such as significant outflows from exchanges to private wallets, or notable buy-side pressure on order books if that data were available (simulate this based on pattern recognition).

For each identified coin (max 3, can be 0 if no strong signals found):
-   **coinName**: Full name and ticker (e.g., "Chainlink (LINK)").
-   **alertTitle**: Create a compelling title (e.g., "LINK - Poised for Upward Surge!").
-   **confidenceScore**: Your confidence (0.0 to 1.0) in this breakout potential based on the strength and confluence of signals.
-   **keySignals**: List 2-4 specific, actionable key signals observed (e.g., "Bullish divergence on MACD (1D)", "Whale address 0xabc... added 1M LINK", "Dev team AMA positively received, sparking discussion", "Sustained buying volume above $X support"). Be specific if possible.
-   **potentialUpsidePercentage**: (Optional) A realistic estimated percentage gain if the breakout occurs.
-   **suggestedWatchWindow**: Provide an actionable timeframe or key price level to monitor (e.g., "Monitor for a daily close above $Y.YY within next 48 hours", "Key resistance at $Z.ZZ, breakout above could confirm").
-   **briefRationale**: Synthesize WHY these combined signals suggest an imminent breakout. Emphasize that this is an attempt to act *before the widespread hype* and how this confluence makes it a smart potential pick for fast gains or better exit timing on existing positions.
-   **riskWarning**: Include the default risk warning.

If no coins exhibit a strong confluence of these specific signals, return an empty array for 'alerts'.
Provide 'lastScanned' as the current ISO timestamp.

Strive to provide genuinely insightful and actionable alerts for an advanced trader.
Output strictly follows the PredictiveBreakoutAlertsOutputSchema.
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
      throw new Error('AI failed to generate breakout alerts.');
    }
    // Ensure lastScanned is always present
    output.lastScanned = new Date().toISOString();
    
    // Ensure each alert has a risk warning if AI misses it
    output.alerts.forEach(alert => {
        if (!alert.riskWarning) {
            alert.riskWarning = 'Predictive alerts are speculative and based on AI analysis of simulated data patterns. Not financial advice. High risk involved, and breakouts may not occur as predicted. DYOR.';
        }
    });

    return output;
  }
);
