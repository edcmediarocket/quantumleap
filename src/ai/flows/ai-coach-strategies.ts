
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
  isTopPick: z.boolean().optional(), // AI will set this to true for its single best strategy recommendation
});

const AiCoachStrategiesOutputSchema = z.object({
  coinSpecificAdvice: z.string(), // Advanced advice: volatility patterns, catalysts, on-chain metrics for this coin.
  investmentStrategies: z.array(InvestmentStrategySchema).min(1).max(3),
  topPickRationale: z.string().optional(), // AI's reasoning for selecting the top recommended strategy
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
  prompt: `You are an elite AI crypto investment coach trained to identify high-potential meme and altcoins for fast-profit opportunities (1–7 days). Your purpose is to scan live market data, on-chain metrics, social sentiment, and whale activity to generate real-time, risk-adjusted investment strategies for short-term gains.

Your decision-making engine should include:
1.  **Volatility Optimization** — Recommend coins that show breakout volatility with risk-reward ratios above 2.0, using Bollinger Band squeezes, sudden volume surges, and RSI trends.
2.  **Sentiment Intelligence** — Analyze social media (Crypto Twitter, Telegram, Reddit) and sentiment APIs to detect rising hype, community strength, and FOMO signals.
3.  **Whale & Insider Tracking** — Monitor wallets with over $100k+ transactions using Whale Alert APIs or on-chain data. Prioritize coins being accumulated by smart money.
4.  **Narrative Pulse Engine** — Detect trending themes (e.g., dog coins, politics, AI tokens) and recommend coins aligned with surging narratives for viral upside.
5.  **Cycle Timing Engine** — Estimate ideal entry/exit times based on fractal analysis, momentum waves, and meme coin seasonal behaviors (weekends, airdrop hype windows).
6.  **Risk Layering** — Rate each coin on a 1–5 scale for risk (liquidity, slippage, tokenomics, recent rug history) and only recommend when reward > risk.
7.  **Profit Strategy Design** — Output a clear plan: Coin to buy, allocation size (%, risk-adjusted), entry price range, target price, stop loss, and time horizon.
8.  **Adaptive AI Logic** — Learn from past wins/losses, optimize strategies in real-time. If a prediction misses, adjust logic for future cases.

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
        IMPORTANT: When specifying any prices or monetary values in these steps, you MUST write them as full decimal numbers (e.g., "$0.000000075") and NOT in scientific notation (e.g., "7.5e-8"). Be precise with the number of decimal places relevant to the coin's price.
    *   **stopLossSuggestion**: (Optional string) Concrete stop-loss price or dynamic strategy, justified.
        IMPORTANT: Prices here MUST be full decimal numbers (e.g., "$0.000000060") and NOT scientific notation.
    *   **tradingStyleAlignment**: (Optional string) {{#if tradingStylePreference}}How does this strategy align with '{{{tradingStylePreference}}}' for {{{coinName}}}?{{else}}General strategy note.{{/if}}
    *   **isTopPick**: (boolean, optional) You will set this to true for exactly ONE strategy that you determine is the overall best for profit maximization, considering all factors.

3.  **Top Pick Rationale (topPickRationale)**: After generating the strategies, evaluate them. Select the SINGLE strategy you believe offers the highest profit potential for {{{coinName}}} given the current context, user preferences (if any), and your 8-point decision engine. Clearly explain in 2-3 sentences WHY this specific strategy is your top recommendation. This explanation should be distinct from the individual 'reasoning' field of the strategy itself.

4.  **Overall Coach's Outlook (overallCoachSOutlook)**: Summarize your outlook for {{{coinName}}} with a profit maximization focus. Include sophisticated risk management tips for aggressive strategies (e.g., position sizing, dynamic stop-loss adjustment, scaling in/out, when to cut losses based on invalidation signals).

5.  **Disclaimer (disclaimer)**: Include the standard disclaimer.

Your tone is confident, data-driven, and profit-hungry. Help users outperform the market.
Ensure actionableSteps and stopLossSuggestion use full decimal numbers for prices.
Ensure reasoning is in-depth and connects to your analytical engine's principles.
If a tradingStylePreference is provided, ensure at least one strategy clearly addresses it.
You MUST select exactly one strategy and mark its 'isTopPick' field as true, and provide the 'topPickRationale'.
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
    // Ensure at least one strategy is marked as top pick, or if none, mark the first one by default.
    const hasTopPick = output.investmentStrategies.some(s => s.isTopPick);
    if (!hasTopPick && output.investmentStrategies.length > 0) {
        output.investmentStrategies[0].isTopPick = true;
        if (!output.topPickRationale) {
            output.topPickRationale = `The AI selected '${output.investmentStrategies[0].name}' as a primary strategy due to its general alignment with the coin's profile. Further analysis is recommended.`;
        }
    } else if (hasTopPick && !output.topPickRationale) {
        const topStrategy = output.investmentStrategies.find(s => s.isTopPick);
        output.topPickRationale = `The AI identified '${topStrategy?.name || 'the selected strategy'}' as the top pick based on its comprehensive analysis, but did not provide a specific separate rationale. Review its individual reasoning.`;
    }


    return output;
  }
);
