
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
  low: z.number().describe('The lower bound of the price range.'),
  high: z.number().describe('The upper bound of the price range.'),
});

const AiCoachStrategiesInputSchema = z.object({
  coinName: z.string().describe('The name or ticker symbol of the cryptocurrency.'),
  currentRationale: z.string().describe('The existing AI rationale for why this coin was picked.'),
  predictedGainPercentage: z.number().describe('The predicted percentage gain for this coin.'),
  entryPriceRange: PriceRangeSchema.describe('The recommended entry price range.'),
  exitPriceRange: PriceRangeSchema.describe('The recommended exit price range.'),
  estimatedDuration: z.string().describe('The estimated duration to reach the profit target.'),
  profitTarget: z.number().optional().describe('The user\'s desired profit target in USD (if provided).'),
  riskTolerance: z.enum(['low', 'medium', 'high']).optional().describe('The user\'s risk tolerance (if provided).'),
  tradingStylePreference: z.enum(['short-term', 'swing', 'scalp']).optional().describe('User\'s preferred trading style (if any).'),
});
export type AiCoachStrategiesInput = z.infer<typeof AiCoachStrategiesInputSchema>;

const InvestmentStrategySchema = z.object({
  name: z.string().describe('The name of the investment strategy (e.g., "Aggressive Profit Maximization", "Calculated Swing for Max Gain", "Precision Entry & Scaled Exit").'),
  description: z.string().describe('A detailed description of the strategy focusing on profit maximization for an advanced user.'),
  reasoning: z.string().describe('Why this strategy is optimal for this specific coin and current context to maximize profit, considering its volatility, potential, and the user\'s parameters if available. Explain how it leverages the predicted gain, entry/exit points, or duration for superior returns. Detail the specific market conditions or indicators that would validate this strategy.'),
  optimalBuyPrice: z.number().optional().describe('A specific, strategically justified suggested optimal buy price for initiating this strategy. Explain why this price is optimal (e.g., key support, Fibonacci retracement, order block confluence).'),
  targetSellPrices: z.array(z.number()).min(1).describe('One or more specific, strategically determined target sell prices for taking profits at different levels (e.g., initial conservative target, primary target based on prediction, ambitious stretch target if momentum is strong). Justify these targets (e.g., based on Fibonacci extensions, key resistance, psychological levels).'),
  actionableSteps: z.array(z.string()).min(2).max(4).describe('A few (2-4) concrete, actionable steps for implementing this strategy, including setting precise buy orders at the optimal price and sell orders/alerts at target prices. Include key advanced indicators to monitor for entry/exit confirmation (e.g., "Set limit buy at $0.0000000X, with secondary entry at $0.0000000Y (0.618 Fib retracement).", "Place tiered take-profit orders: 30% at $T1, 50% at $T2, hold 20% for $T3.", "Monitor Order Flow Delta and Cumulative Volume Delta (CVD) for buy pressure confirmation before entry, and look for divergences at exit targets."). IMPORTANT: Any prices or monetary values mentioned in these steps MUST be written as full decimal numbers (e.g., 0.000000075) and NOT in scientific notation (e.g., 7.5e-8). Prefix with a dollar sign if applicable (e.g., $0.000000075).'),
  stopLossSuggestion: z.string().optional().describe('A concrete suggestion for a stop-loss level or sophisticated dynamic strategy (e.g., "Set a hard stop-loss at $0.000000XX, representing Y% below optimal buy and below key support.", "Implement a trailing stop-loss of Z% based on 20-period ATR once price surpasses first target.", "Use a Chandelier Exit based on a 22-period ATR with a multiplier of 3 for capturing extended moves."). Justify the stop-loss approach. IMPORTANT: Any prices or monetary values mentioned in this suggestion MUST be written as full decimal numbers (e.g., 0.000000060) and NOT in scientific notation (e.g., 6.0e-8). Prefix with a dollar sign if applicable (e.g., $0.000000060).'),
  tradingStyleAlignment: z.string().optional().describe('If a user preference was given, explain how this specific strategy aligns with the preferred trading style (short-term, swing, scalp) for this coin.'),
});

const AiCoachStrategiesOutputSchema = z.object({
  coinSpecificAdvice: z.string().describe("Advanced, actionable advice tailored to this coin's characteristics (e.g., known volatility patterns, optimal trading hours/sessions, upcoming catalysts/events like token unlocks or protocol upgrades and how to strategically leverage them, liquidity considerations for large trades, key on-chain metrics to watch like NVT ratio or specific smart contract activity)."),
  investmentStrategies: z.array(InvestmentStrategySchema).min(1).max(3).describe('An array of 1-3 recommended investment strategies geared towards maximizing profit for an advanced user.'),
  overallCoachSOutlook: z.string().describe('The AI coach\'s overall outlook and final thoughts for investing in this coin with a profit maximization mindset. Include crucial sophisticated risk management tips tailored for aggressive strategies (e.g., position sizing based on conviction, R:R ratio, and account size; dynamic stop-loss adjustment techniques based on market structure shifts; strategies for scaling in/out of positions to manage risk and secure profits; when to re-evaluate or cut losses quickly based on specific invalidation signals like break of key market structure; importance of not being greedy and adhering to the trade plan; how to adjust strategy if broader market conditions (e.g., Bitcoin dominance, market sentiment shift) change unexpectedly).'),
  disclaimer: z.string().default('Remember, these AI-generated insights are for informational purposes and not financial advice. Cryptocurrency investments are subject to high market risk. Past performance is not indicative of future results. Always do your own research (DYOR) and consult a qualified financial advisor.').describe('A brief disclaimer that this is AI-generated advice and not financial gospel.'),
});
export type AiCoachStrategiesOutput = z.infer<typeof AiCoachStrategiesOutputSchema>;

export async function aiCoachStrategies(input: AiCoachStrategiesInput): Promise<AiCoachStrategiesOutput> {
  return aiCoachStrategiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCoachStrategiesPrompt',
  input: {schema: AiCoachStrategiesInputSchema},
  output: {schema: AiCoachStrategiesOutputSchema},
  prompt: `You are an expert AI Trading Coach specializing in PROFIT MAXIMIZATION for ADVANCED users.
Your goal is to provide highly actionable, sophisticated investment strategies and nuanced advice for a specific cryptocurrency pick.

Coin: {{{coinName}}}
Initial Rationale for Pick: {{{currentRationale}}}
Predicted Gain: {{{predictedGainPercentage}}}%
Entry Price Range: \${{{entryPriceRange.low}}} - \${{{entryPriceRange.high}}}
Exit Price Range: \${{{exitPriceRange.low}}} - \${{{exitPriceRange.high}}}
Estimated Duration: {{{estimatedDuration}}}
{{#if profitTarget}}User's Profit Target: \${{{profitTarget}}}{{/if}}
{{#if riskTolerance}}User's Risk Tolerance: {{{riskTolerance}}}{{/if}}
{{#if tradingStylePreference}}User's Preferred Trading Style: {{{tradingStylePreference}}}{{/if}}

Based on the information above, provide the following with a strong focus on maximizing profit for an advanced trader:

1.  **Coin-Specific Advice (Advanced & Actionable)**: Offer sophisticated insights specific to {{{coinName}}}.
    *   Detail unique volatility patterns, optimal trading hours/sessions (e.g., "high volume during London/NY overlap for this pair").
    *   Identify upcoming catalysts (e.g., mainnet launch, token burn, major partnership, token unlock schedule) and how to strategically leverage them (e.g., "consider front-running positive news if sentiment is strong, or look for 'sell the news' opportunities post-event").
    *   Discuss liquidity considerations for significant trades (e.g., "sufficient liquidity on X exchanges, but be mindful of slippage for orders over Y size").
    *   Suggest specific on-chain metrics (e.g., "NVT signal, SOPR, exchange flows") or advanced indicators (e.g., "VWAP, Ichimoku Cloud, Order Flow Delta") that are particularly relevant for this coin and how to interpret their signals for profit.

2.  **Investment Strategies (Profit Maximization Focus - for Advanced Users)**: Recommend 1 to 3 distinct, advanced investment strategies designed to maximize profit for {{{coinName}}}, considering its profile and the user's parameters. For each strategy:
    *   **Name**: A clear, compelling name (e.g., "Alpha Scalp & Compound", "Momentum Surge Ride", "Catalyst-Driven Breakout Play", "Fibonacci Retracement Entry with Tiered Exits").
    *   **Description**: Explain the strategy in detail, emphasizing how it targets profit maximization and is suited for an experienced trader.
    *   **Reasoning**: Critically analyze *why* this strategy is optimal for {{{coinName}}} in the current market context to achieve *maximum profit*. How does it leverage the predicted gain, specific price levels (support/resistance, Fibonacci, order blocks), volatility, or duration for superior returns? Detail specific market conditions or indicator signals (e.g., "RSI divergence on 4H chart", "MACD bullish crossover above zero line", "breakout above key resistance with high volume confirmation") that would validate initiating this strategy.
    *   **Optimal Buy Price**: Suggest a *precise, strategically justified* optimal buy price. Explain *why* this price is optimal (e.g., confluence of key support level and 0.618 Fibonacci retracement, anticipation of pre-catalyst dip and entry at a major order block, previous resistance turned support).
    *   **Target Sell Prices**: Provide *at least one, preferably multiple (2-3), strategically determined* target sell prices. These could represent different levels for taking partial or full profits (e.g., initial conservative target at R1 resistance, primary target near predicted exit based on measured move, ambitious stretch target at a 1.618 Fibonacci extension if volume and momentum are exceptionally strong). Justify each target.
    *   **Actionable Steps (actionableSteps - 2-4 steps)**: Provide concrete, actionable steps for an advanced trader. Examples: "Set a limit buy order at $0.0000000X, with a secondary, smaller entry point at $0.0000000Y if a wick occurs.", "Place tiered take-profit orders: 30% at $T1, 50% at $T2, hold 20% for $T3.", "Monitor [specific advanced indicator like Cumulative Volume Delta (CVD) or Open Interest] for confirmation of buy pressure before entry and look for signs of distribution (e.g., bearish divergence on CVD) at exit targets."
        IMPORTANT: When specifying any prices or monetary values in these steps (e.g., for limit orders, profit targets), you MUST write them as full decimal numbers (e.g., "$0.000000075") and NOT in scientific notation (e.g., "7.5e-8" or "6.0e-8"). Be precise with the number of decimal places relevant to the coin's price.
    *   **Stop-Loss Suggestion (stopLossSuggestion)**: Provide a concrete stop-loss price or a sophisticated dynamic strategy. Justify it (e.g., "Set initial stop-loss at $0.000000XX, approximately Y% below optimal buy, which invalidates the immediate bullish structure.", "Implement a trailing stop-loss of Z% using the 20-period Average True Range (ATR) once the first profit target is hit to protect gains while allowing for further upside.", "Use a Chandelier Exit based on a 22-period ATR with a multiplier of 3 to ride the trend.").
        IMPORTANT: Similar to Actionable Steps, any prices or monetary values mentioned in this suggestion (e.g., for stop-loss levels) MUST be written as full decimal numbers (e.g., "$0.000000060") and NOT in scientific notation (e.g., "6.0e-8"). Prefix with a dollar sign if appropriate.
    *   **Trading Style Alignment (tradingStyleAlignment)**: {{#if tradingStylePreference}}If this strategy is tailored to the user's preferred style of '{{{tradingStylePreference}}}', explain *how* it aligns with that style for {{{coinName}}}. (e.g., "For a 'scalp' trader, this strategy focuses on small, frequent gains by targeting micro-support/resistance flips on the 5-minute chart."). If it's a general strategy, this can be omitted or briefly noted as such.{{else}}This can be omitted.{{/if}}

3.  **Overall Coach's Outlook (Profit Max Focus & Advanced Risk Management)**: Summarize your overall outlook for investing in {{{coinName}}} with the primary goal of maximizing profit. Include crucial sophisticated risk management tips tailored for aggressive strategies (e.g., "Calculate position size based on a fixed percentage of your trading capital (e.g., 1-2%) and the distance to your stop-loss to maintain consistent risk-reward ratios.", "Dynamically adjust stop-losses to breakeven or into profit as the trade moves favorably (e.g., move SL to entry after 1R profit).", "Consider scaling in/out of positions at key levels to optimize entry and manage risk.", "Define clear invalidation points for your trade thesis; if these are breached, cut losses decisively.", "Avoid emotional trading; stick to your pre-defined plan and profit targets. Don't let greed turn a winner into a loser.", "Be aware of broader market conditions (e.g., Bitcoin's trend, major economic news) and how they might affect {{{coinName}}}; adjust aggressiveness accordingly.").

4.  **Disclaimer**: Include the standard disclaimer.

Format the output strictly according to the AiCoachStrategiesOutputSchema. Ensure strategies are practical, well-explained, and focused on maximizing returns while managing associated risks for an advanced user. Be bold, analytical, and intelligent in your suggestions.
If a tradingStylePreference is provided, ensure at least one strategy clearly addresses it and its alignment.
Ensure actionable steps are specific and give indicator examples. Price mentions in actionableSteps must be full decimals.
Ensure stop-loss suggestions are concrete and justified. Price mentions in stopLossSuggestion must be full decimals.
Reasoning must be in-depth.
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
    // Ensure disclaimer is present
    if (!output.disclaimer) {
      output.disclaimer = 'Remember, these AI-generated insights are for informational purposes and not financial advice. Cryptocurrency investments are subject to high market risk. Past performance is not indicative of future results. Always do your own research (DYOR) and consult a qualified financial advisor.';
    }
    // Ensure strategies have at least 2 actionable steps
    output.investmentStrategies.forEach(strategy => {
        if (strategy.actionableSteps.length < 2) {
            strategy.actionableSteps.push("Review market conditions before executing.", "Set alerts for key price levels.");
             // Add generic steps if AI fails to provide enough
        }
    });
    return output!;
  }
);

