
'use server';

/**
 * @fileOverview An AI agent to recommend coins based on user's profit target.
 *
 * - recommendCoinsForProfitTarget - A function that recommends coins based on the user's profit target and risk tolerance.
 * - RecommendCoinsForProfitTargetInput - The input type for the recommendCoinsForProfitTarget function.
 * - RecommendCoinsForProfitTargetOutput - The return type for the recommendCoinsForProfitTarget function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PriceRangeSchema = z.object({
  low: z.number().describe('The lower bound of the price range.'),
  high: z.number().describe('The upper bound of the price range.'),
});

const RecommendCoinsForProfitTargetInputSchema = z.object({
  profitTarget: z.number().describe('The desired profit target in USD.'),
  riskTolerance: z
    .enum(['low', 'medium', 'high'])
    .describe('The user\'s risk tolerance: low, medium, or high.'),
  investmentAmount: z.number().optional().describe('User\'s intended investment amount in USD (if provided).'),
});
export type RecommendCoinsForProfitTargetInput = z.infer<
  typeof RecommendCoinsForProfitTargetInputSchema
>;

const RecommendedCoinSchema = z.object({
  coinName: z.string().describe('The name of the recommended coin.'),
  estimatedGain: z.number().describe('The estimated percentage gain.'),
  estimatedDuration: z
    .string()
    .describe('The estimated time to reach the profit target (e.g., \'1-3 days\', \'1 week\').'),
  entryPriceRange: PriceRangeSchema.describe('The suggested entry price range as an object with low and high numeric values.'),
  exitPriceRange: PriceRangeSchema.describe('The suggested exit price range as an object with low and high numeric values.'),
  optimalBuyPrice: z.number().optional().describe('A suggested specific optimal buy price within or near the entry range.'),
  targetSellPrices: z.array(z.number()).optional().describe('One or more specific target sell prices to consider for taking profits.'),
  tradeConfidence: z
    .number()
    .optional()
    .describe('A number from 0 to 1 indicating the confidence in this trade. Defaults to 0.5 if not provided by AI.'),
  riskRoiGauge: z.number().optional().describe('Risk/ROI score (0-1, optional, defaults to 0.5).'), // New field
  rationale: z.string().describe('A detailed rationale (at least 3-4 paragraphs, targeting an advanced user) behind recommending this coin. Cover technical and fundamental aspects, market sentiment, relevant news/events, potential catalysts, risks, and how it aligns with the user\'s risk tolerance and profit target to maximize gains.'),
  predictedEntryWindowDescription: z.string().optional().describe('AI textual description of ideal entry window/conditions.'),
  predictedExitWindowDescription: z.string().optional().describe('AI textual description of ideal exit window/conditions/signals.'),
  simulatedEntryCountdownText: z.string().optional().describe('Textual suggestion for a countdown, e.g., "approx. 30 minutes", "around 1 hour".'),
  simulatedPostBuyDropAlertText: z.string().optional().describe('Text for a hypothetical critical drop alert post-entry.'),
});

const RecommendCoinsForProfitTargetOutputSchema = z.object({
  recommendedCoins: z.array(RecommendedCoinSchema).describe('An array of recommended coins.'),
});

export type RecommendCoinsForProfitTargetOutput = z.infer<
  typeof RecommendCoinsForProfitTargetOutputSchema
>;

export async function recommendCoinsForProfitTarget(
  input: RecommendCoinsForProfitTargetInput
): Promise<RecommendCoinsForProfitTargetOutput> {
  return recommendCoinsForProfitTargetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendCoinsForProfitTargetPrompt',
  input: {schema: RecommendCoinsForProfitTargetInputSchema},
  output: {schema: RecommendCoinsForProfitTargetOutputSchema},
  prompt: `You are an AI trading coach for advanced users. A user wants to reach a profit target of {{{profitTarget}}} USD.
The user's risk tolerance is {{{riskTolerance}}}.
{{#if investmentAmount}}The user has indicated a potential investment amount of \${{{investmentAmount}}} USD. Keep this in mind as context, but focus on recommending coins that can achieve the *profitTarget*.{{/if}}
Strive to provide the smartest, most accurate, and actionable advice possible to maximize their profit.

Based on current market conditions, recommend 3-5 coins to trade that could help the user reach their profit target.

For each recommended coin, provide:
1.  **Coin Name**: The full name of the coin and its ticker (e.g., Bitcoin (BTC)).
2.  **Estimated Gain Percentage**: The potential percentage profit.
3.  **Estimated Duration**: How long it might take to reach the target (e.g., "5-10 days", "2 weeks").
4.  **Entry Price Range**: As an object with 'low' and 'high' numeric values (e.g., { low: 50000, high: 50500 }).
5.  **Exit Price Range**: As an object with 'low' and 'high' numeric values (e.g., { low: 55000, high: 56000 }).
6.  **Optimal Buy Price**: (Optional) A specific suggested buy price that represents a particularly good entry point.
7.  **Target Sell Prices**: (Optional) One or more specific price targets for selling and taking profit.
8.  **Trade Confidence**: A score from 0.0 to 1.0 (optional, will default to 0.5 if not provided).
9.  **Risk/ROI Gauge (riskRoiGauge)**: (Optional) Score 0.0 to 1.0, where 0 is very low risk/low ROI, and 1.0 is very high risk/high ROI. Default to 0.5 if unsure.
10. **Detailed Rationale**: An in-depth explanation (at least 3-4 paragraphs, targeting an advanced user) for this recommendation, including:
    *   Relevant technical analysis (support/resistance levels, chart patterns, indicators like RSI, MACD).
    *   Key fundamental factors (project developments, news, adoption, tokenomics).
    *   Current market sentiment and significant whale/social media activity.
    *   How it aligns with the user's risk tolerance and profit target, focusing on profit maximization.
    *   Potential catalysts for price movement and key risks or invalidation points.
11. **Predicted Entry Window Description (predictedEntryWindowDescription)**: (Optional) Textual description of the ideal entry window or conditions (e.g., "Entry favorable in next 2-4h, if BTC holds $60k", "Consider entry on a pullback to the 0.618 Fib level").
12. **Predicted Exit Window Description (predictedExitWindowDescription)**: (Optional) Textual description of ideal exit signals or windows (e.g., "Exit if daily candle closes below $X support", "Target $Y for 50% profit, then trail stop for rest").
13. **Simulated Entry Countdown Text (simulatedEntryCountdownText)**: (Optional) A textual suggestion for a countdown to an ideal entry (e.g., "approx. 1 hour 45 minutes", "potentially 4 hours", "around 20 minutes"). Be specific with units.
14. **Simulated Post-Buy Drop Alert Text (simulatedPostBuyDropAlertText)**: (Optional) Text for a hypothetical critical drop alert after entry (e.g., "SIMULATED ALERT: If {{coinName}} falls 8% sharply post-entry, AI recommends immediate risk assessment."). This text will be used for a simulated alert.

Format the output strictly according to the RecommendCoinsForProfitTargetOutputSchema.
Ensure all numeric values are indeed numbers, not strings.
Example for a single recommended coin:
{
  "coinName": "ExampleCoin (EXM)",
  "estimatedGain": 25.0,
  "estimatedDuration": "7-14 days",
  "entryPriceRange": {"low": 2.50, "high": 2.55},
  "exitPriceRange": {"low": 3.10, "high": 3.20},
  "optimalBuyPrice": 2.51,
  "targetSellPrices": [3.10, 3.15],
  "tradeConfidence": 0.75,
  "riskRoiGauge": 0.6,
  "rationale": "Multi-paragraph detailed rationale targeting advanced users, covering TA, FA, market sentiment, profit maximization for user's goal...",
  "predictedEntryWindowDescription": "Entry looks good on a test of the $2.50 support level.",
  "predictedExitWindowDescription": "Take profit at $3.10, consider a stop-loss below $2.40.",
  "simulatedEntryCountdownText": "approx. 2 hours 30 minutes",
  "simulatedPostBuyDropAlertText": "SIMULATED ALERT: If EXM drops 10% rapidly after entry, re-evaluate holding."
}
`,
});

const recommendCoinsForProfitTargetFlow = ai.defineFlow(
  {
    name: 'recommendCoinsForProfitTargetFlow',
    inputSchema: RecommendCoinsForProfitTargetInputSchema,
    outputSchema: RecommendCoinsForProfitTargetOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.recommendedCoins) {
        throw new Error("AI failed to generate valid coin recommendations.");
    }
    output.recommendedCoins.forEach(coin => {
      if (coin.tradeConfidence === undefined) {
        coin.tradeConfidence = 0.5;
      }
      if (coin.riskRoiGauge === undefined) {
        coin.riskRoiGauge = 0.5; // Default if missing
      }
    });
    return output!;
  }
);
