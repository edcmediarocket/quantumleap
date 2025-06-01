
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
  low: z.number(),
  high: z.number(),
});

const RecommendCoinsForProfitTargetInputSchema = z.object({
  profitTarget: z.number(),
  riskTolerance: z
    .enum(['low', 'medium', 'high']),
  investmentAmount: z.number().optional(),
});
export type RecommendCoinsForProfitTargetInput = z.infer<
  typeof RecommendCoinsForProfitTargetInputSchema
>;

const RecommendedCoinSchema = z.object({
  coinName: z.string(), // e.g., "Bitcoin (BTC)"
  estimatedGain: z.number(), // e.g., 25.0 for 25%
  estimatedDuration: z
    .string(), // e.g., '1-3 days'
  entryPriceRange: PriceRangeSchema, // {low: 100, high: 102}
  exitPriceRange: PriceRangeSchema, // {low: 125, high: 128}
  optimalBuyPrice: z.number().optional(),
  targetSellPrices: z.array(z.number()).optional(),
  tradeConfidence: z
    .number()
    .optional(), // 0.0 to 1.0, default 0.5
  riskRoiGauge: z.number().optional(), // 0.0 to 1.0, default 0.5
  rationale: z.string(), // Detailed rationale, including TA, FA, sentiment, risk alignment.
  predictedEntryWindowDescription: z.string().optional(),
  predictedExitWindowDescription: z.string().optional(),
  simulatedEntryCountdownText: z.string().optional(), // e.g., "approx. 30m"
  simulatedPostBuyDropAlertText: z.string().optional(), // e.g., "If {{coinName}} drops..."
});

const RecommendCoinsForProfitTargetOutputSchema = z.object({
  recommendedCoins: z.array(RecommendedCoinSchema),
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
  prompt: `You are an elite AI crypto investment coach. Your mission is to help users outperform the market with precision, not guesswork.
A user wants to reach a profit target of {{{profitTarget}}} USD.
The user's risk tolerance is {{{riskTolerance}}}.
{{#if investmentAmount}}The user has indicated a potential investment amount of \${{{investmentAmount}}} USD. Keep this in mind as context.{{/if}}

Leverage your advanced decision-making engine:
1.  **Volatility Optimization**: Seek coins with breakout potential and good risk-reward ratios.
2.  **Sentiment Intelligence**: Analyze social media and news for hype and FOMO signals.
3.  **Whale & Insider Tracking**: Monitor large transactions and smart money movements.
4.  **Narrative Pulse Engine**: Identify coins aligned with trending themes.
5.  **Cycle Timing Engine**: Estimate ideal entry/exit times.
6.  **Risk Layering**: Align coin risk (liquidity, tokenomics) with the user's {{{riskTolerance}}}.
7.  **Profit Strategy Design**: Devise a clear plan for each recommendation.
8.  **Adaptive AI Logic**: (Conceptual) Learn and optimize.

Your primary goal is to recommend 3-5 coins that can realistically help the user achieve their {{{profitTarget}}} USD profit, considering their {{{riskTolerance}}}.
While fast flips are good, the strategy should align with the profit target's achievability.

For each recommended coin, map your findings to the RecommendCoinsForProfitTargetOutputSchema:
-   'coinName': (string) Full name and ticker (e.g., Bitcoin (BTC)).
-   'estimatedGain': (number) The potential percentage profit needed to contribute to the overall profit target, or if a single coin strategy, to meet it.
-   'estimatedDuration': (string) How long it might take (e.g., "5-10 days", "2 weeks").
-   'entryPriceRange': (object {low: number, high: number}). Ensure values are numeric.
-   'exitPriceRange': (object {low: number, high: number}). Ensure values are numeric.
-   'optimalBuyPrice': (number, optional) A specific suggested buy price.
-   'targetSellPrices': (array of numbers, optional) Specific price targets for selling.
-   'tradeConfidence': (number, 0.0-1.0, optional) Your confidence in this trade achieving its part of the goal.
-   'riskRoiGauge': (number, 0.0-1.0, optional) Your assessment of risk vs. reward for this specific coin in context of the user's goal.
-   'rationale': (string) A detailed explanation (3-4 paragraphs for advanced users). Cover:
    *   Relevant technical analysis (support/resistance, patterns, indicators).
    *   Key fundamental factors (project developments, news, tokenomics).
    *   Current market sentiment, whale/social activity.
    *   How it aligns with {{{riskTolerance}}} and contributes to achieving {{{profitTarget}}}.
    *   Potential catalysts and key risks/invalidation points. Include a "Suggested Stop Loss" within this rationale.
-   'predictedEntryWindowDescription': (string, optional) Ideal entry window/conditions.
-   'predictedExitWindowDescription': (string, optional) Ideal exit signals/windows.
-   'simulatedEntryCountdownText': (string, optional) Textual countdown to ideal entry (e.g., "approx. 1h 45m").
-   'simulatedPostBuyDropAlertText': (string, optional) Text for a hypothetical critical drop alert (e.g., "SIMULATED ALERT: If {{coinName}} falls 8% sharply post-entry, AI recommends immediate risk assessment.").

Your tone should be confident, data-driven, and profit-hungry, but also mindful of the user's specific profit goal and risk tolerance.
Ensure all numeric fields are numbers. Price values in ranges must be numbers.
If no suitable coins are found, return an empty array for 'recommendedCoins'.
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
        return { recommendedCoins: [] };
    }
    output.recommendedCoins.forEach(coin => {
      coin.tradeConfidence = Math.max(0, Math.min(1, coin.tradeConfidence === undefined ? 0.5 : coin.tradeConfidence));
      coin.riskRoiGauge = Math.max(0, Math.min(1, coin.riskRoiGauge === undefined ? 0.5 : coin.riskRoiGauge));
      if (!coin.rationale.toLowerCase().includes("stop loss:")) {
        coin.rationale += "\nSuggested Stop Loss: Define based on your strategy and market conditions (e.g., 5-10% or key technical level).";
      }
    });
    return output;
  }
);
