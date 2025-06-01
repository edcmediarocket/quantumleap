
'use server';
/**
 * @fileOverview Provides AI coaching and investment strategies for a specific cryptocurrency.
 *
 * - aiCoachStrategies - A function that generates investment strategies.
 * - AiCoachStrategiesInput - The input type for the aiCoachStrategies function.
 * - AiCoachStrategiesOutput - The return type for the aiCoachStrategies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PriceRangeSchema = z.object({
  low: z.number(),
  high: z.number(),
});

const AiCoachStrategiesInputSchema = z.object({
  coinName: z.string(),
  currentRationale: z.string(),
  predictedGainPercentage: z.number(),
  entryPriceRange: PriceRangeSchema,
  exitPriceRange: PriceRangeSchema,
  estimatedDuration: z.string(),
  profitTarget: z.number().optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
  tradingStylePreference: z.enum(['short-term', 'swing', 'scalp']).optional(),
});
export type AiCoachStrategiesInput = z.infer<typeof AiCoachStrategiesInputSchema>;

const InvestmentStrategySchema = z.object({
  name: z.string(),
  description: z.string(),
  reasoning: z.string(), // How it leverages coin's profile (volatility, sentiment, etc.) for profit.
  optimalBuyPrice: z.number().optional(),
  targetSellPrices: z.array(z.number()).min(1),
  actionableSteps: z.array(z.string()).min(2).max(4), // Include indicator examples. Prices must be full decimals.
  stopLossSuggestion: z.string().optional(), // Concrete suggestion, justified. Prices must be full decimals.
  tradingStyleAlignment: z.string().optional(),
});

const AiCoachStrategiesOutputSchema = z.object({
  coinSpecificAdvice: z.string(), // Advanced advice: volatility patterns, catalysts, on-chain metrics for this coin.
  investmentStrategies: z.array(InvestmentStrategySchema).min(1).max(3),
  overallCoachSOutlook: z.string(), // Outlook & advanced risk management for profit maximization.
  disclaimer: z.string().default('Remember, these AI-generated insights are for informational purposes... DYOR.'),
});
export type AiCoachStrategiesOutput = z.infer<typeof AiCoachStrategiesOutputSchema>;

export async function aiCoachStrategies(input: AiCoachStrategiesInput): Promise<AiCoachStrategiesOutput> {
  return aiCoachStrategiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCoachStrategiesPrompt',
  input: {schema: AiCoachStrategiesInputSchema},
  output: {schema: AiCoachStrategiesOutputSchema},
  prompt: `You are an elite AI crypto investment coach. For the given coin, {{{coinName}}}, you will provide advanced trading strategies.
Your analysis and strategy formulation MUST be guided by your deep understanding of:
1.  **Volatility Optimization**: How does this coin's volatility profile (e.g., ATR, Bollinger Bands) inform strategy?
2.  **Sentiment Intelligence**: What is the current social/news sentiment, and how can it be leveraged?
3.  **Whale & Insider Tracking**: Are there recent whale activities or on-chain signals relevant to this coin?
4.  **Narrative Pulse Engine**: Is this coin part of a trending narrative? How does that affect strategy?
5.  **Cycle Timing Engine**: What are the ideal entry/exit considerations based on its typical cycle or momentum waves?
6.  **Risk Layering**: How does the coin's intrinsic risk (liquidity, tokenomics) and the user's risk tolerance (if provided: {{{riskTolerance}}}) shape the strategy?
7.  **Profit Strategy Design**: How can we maximize profit for {{{coinName}}} given its current context?
8.  **Adaptive AI Logic**: (Conceptual) Apply learned patterns.

Coin Details:
-   Name: {{{coinName}}}
-   Initial Rationale for Pick: {{{currentRationale}}}
-   Predicted Gain: {{{predictedGainPercentage}}}%
-   Entry Price Range: \${{{entryPriceRange.low}}} - \${{{entryPriceRange.high}}}
-   Exit Price Range: \${{{exitPriceRange.low}}} - \${{{exitPriceRange.high}}}
-   Estimated Duration: {{{estimatedDuration}}}
{{#if profitTarget}}- User's Profit Target: \${{{profitTarget}}}{{/if}}
{{#if riskTolerance}}- User's Risk Tolerance: {{{riskTolerance}}}{{/if}}
{{#if tradingStylePreference}}- User's Preferred Trading Style: {{{tradingStylePreference}}}{{/if}}

Based on the coin's details and your analytical engine, provide the following, focusing on PROFIT MAXIMIZATION for an ADVANCED user. Output strictly according to AiCoachStrategiesOutputSchema.

1.  **Coin-Specific Advice (coinSpecificAdvice)**: Offer sophisticated, actionable insights specific to {{{coinName}}}.
    *   Detail unique volatility patterns, optimal trading hours/sessions.
    *   Identify upcoming catalysts (e.g., mainnet launch, token burn) and how to strategically leverage them.
    *   Discuss liquidity considerations for significant trades.
    *   Suggest specific on-chain metrics (e.g., NVT signal, SOPR) or advanced indicators (e.g., VWAP, Order Flow Delta) relevant for THIS coin and how to interpret their signals for profit.

2.  **Investment Strategies (investmentStrategies - 1 to 3 strategies)**: For each strategy:
    *   **name**: Compelling name (e.g., "Alpha Scalp & Compound", "Momentum Surge Ride").
    *   **description**: Detailed explanation, emphasizing profit maximization for experienced traders.
    *   **reasoning**: CRITICAL: Why is this strategy optimal for {{{coinName}}} NOW to maximize profit? How does it leverage its volatility, sentiment, predicted gain, specific price levels (support/resistance, Fibonacci, order blocks), for superior returns? What market conditions/indicator signals validate this strategy?
    *   **optimalBuyPrice**: (Optional) Precise, justified optimal buy price. Why is it optimal? (e.g., confluence of support and 0.618 Fib).
    *   **targetSellPrices**: (Array of numbers, min 1) Strategically determined target sell prices for profit taking. Justify each.
    *   **actionableSteps**: (Array of 2-4 strings) Concrete steps. Example: "Set limit buy at $X.XXX, with secondary at $Y.YYY. Place tiered take-profit: 30% at $T1, 50% at $T2. Monitor [advanced indicator] for confirmation."
        IMPORTANT: Any prices or monetary values in these steps MUST be written as full decimal numbers (e.g., "$0.000000075") and NOT in scientific notation (e.g., "7.5e-8").
    *   **stopLossSuggestion**: (Optional string) Concrete stop-loss price or dynamic strategy, justified.
        IMPORTANT: Prices here MUST be full decimal numbers (e.g., "$0.000000060") and NOT scientific notation.
    *   **tradingStyleAlignment**: (Optional string) {{#if tradingStylePreference}}How does this strategy align with '{{{tradingStylePreference}}}' for {{{coinName}}}?{{else}}General strategy note.{{/if}}

3.  **Overall Coach's Outlook (overallCoachSOutlook)**: Summarize your outlook for {{{coinName}}} with a profit maximization focus. Include sophisticated risk management tips for aggressive strategies (e.g., position sizing, dynamic stop-loss adjustment, scaling in/out, when to cut losses based on invalidation signals).

4.  **Disclaimer (disclaimer)**: Include the standard disclaimer.

Your tone is confident, data-driven, and profit-hungry. Help users outperform the market.
Ensure actionableSteps and stopLossSuggestion use full decimal numbers for prices.
Ensure reasoning is in-depth and connects to your analytical engine's principles.
If a tradingStylePreference is provided, ensure at least one strategy clearly addresses it.
`,
});

const aiCoachStrategiesFlow = ai.defineFlow(
  {
    name: 'aiCoachStrategiesFlow',
    inputSchema: AiCoachStrategiesInputSchema,
    outputSchema: AiCoachStrategiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI coach failed to generate strategies.");
    }
    if (!output.disclaimer) {
      output.disclaimer = 'Remember, these AI-generated insights are for informational purposes and not financial advice. Cryptocurrency investments are subject to high market risk. Past performance is not indicative of future results. Always do your own research (DYOR) and consult a qualified financial advisor.';
    }
    output.investmentStrategies.forEach(strategy => {
        if (strategy.actionableSteps.length < 2) {
            strategy.actionableSteps.push("Review market conditions before executing.", "Set alerts for key price levels.");
        }
    });
    return output;
  }
);
