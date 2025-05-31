
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
  optimalBuyPrice: z.number().optional().describe('A specific, strategically justified suggested optimal buy price for initiating this strategy. Explain why this price is optimal (e.g., key support, Fibonacci retracement).'),
  targetSellPrices: z.array(z.number()).min(1).describe('One or more specific, strategically determined target sell prices for taking profits at different levels (e.g., initial conservative target, primary target based on prediction, ambitious stretch target if momentum is strong). Justify these targets.'),
  actionableSteps: z.array(z.string()).describe('A few concrete, actionable steps for implementing this strategy, including setting precise buy orders at the optimal price and sell orders/alerts at target prices. Include key indicators to monitor for entry/exit confirmation.'),
  stopLossSuggestion: z.string().optional().describe('A concrete suggestion for a stop-loss level or dynamic strategy (e.g., "Set a hard stop-loss at $X.XX, representing Y% below optimal buy", "Implement a trailing stop-loss of Z% once price surpasses first target."). Justify the stop-loss approach.'),
  tradingStyleAlignment: z.string().optional().describe('If a user preference was given, explain how this specific strategy aligns with the preferred trading style (short-term, swing, scalp) for this coin.'),
});

const AiCoachStrategiesOutputSchema = z.object({
  coinSpecificAdvice: z.string().describe("Advanced, actionable advice tailored to this coin's characteristics (e.g., known volatility patterns, upcoming catalysts/events that could be leveraged, liquidity considerations, optimal trading hours, key on-chain metrics to watch)."),
  investmentStrategies: z.array(InvestmentStrategySchema).min(1).max(3).describe('An array of 1-3 recommended investment strategies geared towards maximizing profit for an advanced user.'),
  overallCoachSOutlook: z.string().describe('The AI coach\'s overall outlook and final thoughts for investing in this coin with a profit maximization mindset. Include crucial sophisticated risk management tips (e.g., position sizing based on conviction and volatility, dynamic stop-loss strategies, scaling in/out of positions, when to re-evaluate or cut losses quickly based on specific signals).'),
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

Based on the information above, provide the following with a strong focus on maximizing profit:

1.  **Coin-Specific Advice (Advanced & Actionable)**: Offer sophisticated insights specific to {{{coinName}}}.
    *   Detail unique volatility patterns or optimal trading hours.
    *   Identify upcoming catalysts (e.g., mainnet launch, token burn, major partnership) and how to strategically leverage them.
    *   Discuss liquidity considerations for significant trades.
    *   Suggest specific on-chain metrics or advanced indicators that are particularly relevant for this coin and how to interpret their signals.

2.  **Investment Strategies (Profit Maximization Focus - for Advanced Users)**: Recommend 1 to 3 distinct, advanced investment strategies designed to maximize profit for {{{coinName}}}, considering its profile and the user's parameters. For each strategy:
    *   **Name**: A clear, compelling name (e.g., "Alpha Scalp & Compound", "Momentum Surge Ride", "Catalyst-Driven Breakout Play").
    *   **Description**: Explain the strategy in detail, emphasizing how it targets profit maximization and is suited for an experienced trader.
    *   **Reasoning**: Critically analyze *why* this strategy is optimal for {{{coinName}}} in the current market context to achieve *maximum profit*. How does it leverage the predicted gain, specific price levels (support/resistance, Fibonacci), volatility, or duration for superior returns? Detail specific market conditions or indicator signals that would validate initiating this strategy.
    *   **Optimal Buy Price**: Suggest a *precise, strategically justified* optimal buy price. Explain why this price is optimal (e.g., confluence of key support level and 0.618 Fibonacci retracement, anticipation of pre-catalyst dip).
    *   **Target Sell Prices**: Provide *at least one, preferably multiple, strategically determined* target sell prices. These could represent different levels for taking partial or full profits (e.g., initial conservative target at R1 resistance, primary target near predicted exit, ambitious stretch target if volume and momentum are exceptionally strong). Justify each target (e.g., based on Fibonacci extensions, psychological levels, measured moves from patterns).
    *   **Actionable Steps**: Provide 2-4 concrete, actionable steps for an advanced trader. Examples: "Set a limit buy order at \${{{optimalBuyPrice}}} with a secondary entry point at \${lower_support_if_applicable}.", "Place tiered take-profit orders at \${target_1}, \${target_2}.", "Monitor [specific advanced indicator like CVD or Open Interest] for confirmation before entry and divergence at exit targets."
    *   **Stop-Loss Suggestion**: Provide a concrete stop-loss price or a sophisticated dynamic strategy. Justify it (e.g., "Set initial stop-loss at \${key_support_level}, then trail by X% of ATR once the first profit target is hit.", "Use a Chandelier Exit based on 22-period ATR with a multiplier of 3.").
    *   **Trading Style Alignment (tradingStyleAlignment)**: {{#if tradingStylePreference}}If this strategy is tailored to the user's preferred style of '{{{tradingStylePreference}}}', explain *how* it aligns with that style for {{{coinName}}}. If it's a general strategy, this can be omitted or briefly noted as such.{{else}}This can be omitted.{{/if}}

3.  **Overall Coach's Outlook (Profit Max Focus & Advanced Risk Management)**: Summarize your overall outlook for investing in {{{coinName}}} with the primary goal of maximizing profit. Include crucial sophisticated risk management tips tailored for aggressive strategies (e.g., position sizing relative to conviction/volatility, dynamic stop-loss adjustment techniques, strategies for scaling in/out of positions, when to cut losses quickly based on specific invalidation signals, importance of not being greedy and sticking to the plan, how to adjust strategy if broader market conditions shift unexpectedly).

4.  **Disclaimer**: Include the standard disclaimer.

Format the output strictly according to the AiCoachStrategiesOutputSchema. Ensure strategies are practical, well-explained, and focused on maximizing returns while managing associated risks for an advanced user. Be bold, analytical, and intelligent in your suggestions.
If a tradingStylePreference is provided, ensure at least one strategy clearly addresses it and its alignment.
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
    return output!;
  }
);

