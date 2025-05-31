
// 'use server';
/**
 * @fileOverview AI coin picks flow that recommends the top 3-5 coins predicted to yield quick profits based on real-time data analytics.
 *
 * - aiCoinPicks - A function that handles the AI coin picks process.
 * - AiCoinPicksInput - The input type for the aiCoinPicks function.
 * - AiCoinPicksOutput - The return type for the aiCoinPicks function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PriceRangeSchema = z.object({
  low: z.number().describe('Lower price bound.'),
  high: z.number().describe('Upper price bound.'),
});

const AiCoinPicksInputSchema = z.object({
  profitTarget: z
    .number()
    .describe('Desired profit in USD.'), // Shorter
  strategy: z.enum(['short-term', 'swing', 'scalp']).default('short-term').describe('Trading strategy.'), // Shorter
});
export type AiCoinPicksInput = z.infer<typeof AiCoinPicksInputSchema>;

const AiCoinPickSchema = z.object({
  coin: z.string().describe('Coin ticker.'),
  predictedGainPercentage: z.number().describe('Predicted % gain.'),
  entryPriceRange: PriceRangeSchema.describe('Entry price (low/high).'),
  exitPriceRange: PriceRangeSchema.describe('Exit price (low/high).'),
  optimalBuyPrice: z.number().optional().describe('Optimal buy price (opt).'),
  targetSellPrices: z.array(z.number()).optional().describe('Target sell prices (opt array).'),
  confidenceMeter: z.number().describe('Confidence score (0-1).'), // No min/max for schema simplicity
  rationale: z.string().describe('Advanced rationale: TA, FA, sentiment, whale/social, catalysts, risks. Profit focus.'),
  estimatedDuration: z.string().describe('Estimated duration to profit.'),
  riskRoiGauge: z.number().describe('Risk/ROI score (0-1).'), // New field
  predictedEntryWindowDescription: z.string().optional().describe('AI textual description of ideal entry window/conditions.'),
  predictedExitWindowDescription: z.string().optional().describe('AI textual description of ideal exit window/conditions/signals.'),
  simulatedEntryCountdownText: z.string().optional().describe('Textual suggestion for a countdown, e.g., "approx. 30 minutes", "around 1 hour".'),
  simulatedPostBuyDropAlertText: z.string().optional().describe('Text for a hypothetical critical drop alert post-entry.'),
});

const AiCoinPicksOutputSchema = z.object({
  picks: z.array(AiCoinPickSchema).describe('An array of recommended coin picks.'),
});

export type AiCoinPicksOutput = z.infer<typeof AiCoinPicksOutputSchema>;

export async function aiCoinPicks(input: AiCoinPicksInput): Promise<AiCoinPicksOutput> {
  return aiCoinPicksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCoinPicksPrompt',
  input: {schema: AiCoinPicksInputSchema},
  output: {schema: AiCoinPicksOutputSchema},
  prompt: `You are a sophisticated cryptocurrency trading AI for advanced users.
Based on comprehensive real-time data analytics, whale activity tracking, deep market sentiment analysis, and trending social media data, recommend the top 3-5 coins predicted to yield quick profits.

Consider the user's profit target of {{{profitTarget}}} USD and their chosen trading strategy of {{{strategy}}}.
Strive to provide the smartest, most accurate, and actionable advice possible.

For each recommended coin, provide:
1.  **Coin Ticker (coin)**
2.  **Predicted Gain Percentage (predictedGainPercentage)**
3.  **Entry Price Range (entryPriceRange)**: {'low': number, 'high': number}
4.  **Exit Price Range (exitPriceRange)**: {'low': number, 'high': number}
5.  **Optimal Buy Price (optimalBuyPrice)**: (Optional) Specific suggested buy price.
6.  **Target Sell Prices (targetSellPrices)**: (Optional) Array of specific target sell prices.
7.  **Confidence Meter (confidenceMeter)**: Score 0.0 to 1.0.
8.  **Detailed Rationale (rationale)**: In-depth (3-4 paragraphs, advanced user focus) covering: TA (RSI, MACD, patterns), FA (updates, tokenomics, news), market sentiment, whale activity, social media trends, profit opportunity synthesis, catalysts, risks. Focus on profit maximization.
9.  **Estimated Duration (estimatedDuration)**: Timeframe (e.g., "3-7 days", "1-2 weeks").
10. **Risk/ROI Gauge (riskRoiGauge)**: Score 0.0 to 1.0, where 0 is very low risk/low ROI, and 1.0 is very high risk/high ROI.
11. **Predicted Entry Window Description (predictedEntryWindowDescription)**: (Optional) Textual description of the ideal entry window or conditions (e.g., "Entry favorable in next 1-2h, watch for X signal", "Consider entry if price consolidates above Y for 30 mins").
12. **Predicted Exit Window Description (predictedExitWindowDescription)**: (Optional) Textual description of ideal exit signals or windows (e.g., "Exit on clear momentum loss on 15m chart or after 25% gain", "Target $Z, then re-evaluate").
13. **Simulated Entry Countdown Text (simulatedEntryCountdownText)**: (Optional) A textual suggestion for a countdown to an ideal entry (e.g., "approx. 25 minutes", "around 1 hour 10 minutes", "potentially 3 hours"). Be specific with units.
14. **Simulated Post-Buy Drop Alert Text (simulatedPostBuyDropAlertText)**: (Optional) Text for a hypothetical critical drop alert after entry (e.g., "ALERT SIM: If {{coin}} drops sharply by 12% within 1h of entry, AI advises immediate risk review."). This text will be used for a simulated alert.

Format output strictly as AiCoinPicksOutputSchema. Numeric values must be numbers.
Example for a single pick:
{
  "coin": "XYZ",
  "predictedGainPercentage": 15.5,
  "entryPriceRange": {"low": 1.20, "high": 1.25},
  "exitPriceRange": {"low": 1.38, "high": 1.45},
  "optimalBuyPrice": 1.21,
  "targetSellPrices": [1.38, 1.42, 1.45],
  "confidenceMeter": 0.85,
  "rationale": "Detailed rationale...",
  "estimatedDuration": "5-10 days",
  "riskRoiGauge": 0.7,
  "predictedEntryWindowDescription": "Entry looks good in the next 1-3 hours if Bitcoin remains stable.",
  "predictedExitWindowDescription": "Consider taking profits around $1.42, or if RSI (14) on 1h chart goes above 75.",
  "simulatedEntryCountdownText": "approx. 1 hour 30 minutes",
  "simulatedPostBuyDropAlertText": "SIMULATED ALERT: If XYZ drops 10% quickly after entry, AI suggests re-evaluating position."
}
`,
});

const aiCoinPicksFlow = ai.defineFlow(
  {
    name: 'aiCoinPicksFlow',
    inputSchema: AiCoinPicksInputSchema,
    outputSchema: AiCoinPicksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.picks) {
        throw new Error("AI failed to generate valid coin picks.");
    }
    output.picks.forEach(pick => {
      if (pick.confidenceMeter === undefined) pick.confidenceMeter = 0.5;
      if (pick.riskRoiGauge === undefined) pick.riskRoiGauge = 0.5; // Default if missing
    });
    return output!;
  }
);

