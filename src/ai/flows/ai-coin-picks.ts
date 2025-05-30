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
  low: z.number().describe('Lower price bound.'), // Concise
  high: z.number().describe('Upper price bound.'), // Concise
});

const AiCoinPicksInputSchema = z.object({
  profitTarget: z
    .number()
    .describe('The desired profit target in USD.'),
  strategy: z.enum(['short-term', 'swing', 'scalp']).default('short-term').describe('The trading strategy to use.'),
});
export type AiCoinPicksInput = z.infer<typeof AiCoinPicksInputSchema>;

const AiCoinPicksOutputSchema = z.object({
  picks: z.array(
    z.object({
      coin: z.string().describe('Coin ticker.'), // Concise
      predictedGainPercentage: z.number().describe('Predicted % gain.'), // Concise
      entryPriceRange: PriceRangeSchema.describe('Entry price (low/high).'), // Concise
      exitPriceRange: PriceRangeSchema.describe('Exit price (low/high).'), // Concise
      optimalBuyPrice: z.number().optional().describe('Optimal buy price (opt).'), // Concise
      targetSellPrices: z.array(z.number()).optional().describe('Target sell prices (opt array).'), // Concise
      confidenceMeter: z.number().describe('Confidence score (0-1).'), // Concise
      rationale: z.string().describe('Advanced rationale: TA, FA, sentiment, whale/social, catalysts, risks. Profit focus.'), // Keep detailed
      estimatedDuration: z.string().describe('Estimated duration to profit.'), // Concise
      riskRoiGauge: z.number().describe('Risk/ROI score (0-1).'), // Concise
    })
  ).describe('An array of recommended coin picks.'),
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
8.  **Detailed Rationale (rationale)**: In-depth (3-4 paragraphs, advanced user focus) covering: TA (RSI, MACD, patterns), FA (updates, tokenomics, news), market sentiment, whale activity, social media trends, profit opportunity synthesis, catalysts, risks.
9.  **Estimated Duration (estimatedDuration)**: Timeframe (e.g., "3-7 days").
10. **Risk/ROI Gauge (riskRoiGauge)**: Score 0.0 to 1.0.

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
  "riskRoiGauge": 0.7
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
      if (pick.riskRoiGauge === undefined) pick.riskRoiGauge = 0.5;
    });
    return output!;
  }
);
