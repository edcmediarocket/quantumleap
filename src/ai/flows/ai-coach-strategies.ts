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
});
export type AiCoachStrategiesInput = z.infer<typeof AiCoachStrategiesInputSchema>;

const InvestmentStrategySchema = z.object({
  name: z.string().describe('The name of the investment strategy (e.g., "Aggressive Profit Maximization", "Calculated Swing for Max Gain").'),
  description: z.string().describe('A detailed description of the strategy focusing on profit maximization.'),
  reasoning: z.string().describe('Why this strategy is suitable for this specific coin and current context to maximize profit, considering its volatility, potential, and the user\'s parameters if available. Explain how it leverages the predicted gain, entry/exit points, or duration for optimal returns.'),
  optimalBuyPrice: z.number().optional().describe('A specific suggested optimal buy price for initiating this strategy.'),
  targetSellPrices: z.array(z.number()).min(1).describe('One or more specific target sell prices for taking profits at different levels. Could include an initial target and stretch targets.'),
  actionableSteps: z.array(z.string()).describe('A few concrete, actionable steps for implementing this strategy, including setting buy orders at the optimal price and sell orders/alerts at target prices.'),
  stopLossSuggestion: z.string().optional().describe('A suggestion for a stop-loss level or strategy to manage risk for this specific approach.'),
});

const AiCoachStrategiesOutputSchema = z.object({
  coinSpecificAdvice: z.string().describe("Advanced advice tailored to this coin's characteristics (e.g., known volatility patterns, upcoming catalysts/events that could be leveraged, liquidity considerations)."),
  investmentStrategies: z.array(InvestmentStrategySchema).min(1).max(3).describe('An array of 1-3 recommended investment strategies geared towards maximizing profit.'),
  overallCoachSOutlook: z.string().describe('The AI coach\'s overall outlook and final thoughts for investing in this coin with a profit maximization mindset. Include crucial risk management tips (e.g., position sizing for aggressive trades, when to re-evaluate, dynamic stop-loss strategies).'),
  disclaimer: z.string().default('Remember, these AI-generated insights are for informational purposes and not financial advice. Cryptocurrency investments are subject to high market risk. Past performance is not indicative of future results. Always do your own research (DYOR).').describe('A brief disclaimer that this is AI-generated advice and not financial gospel.'),
});
export type AiCoachStrategiesOutput = z.infer<typeof AiCoachStrategiesOutputSchema>;

export async function aiCoachStrategies(input: AiCoachStrategiesInput): Promise<AiCoachStrategiesOutput> {
  return aiCoachStrategiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCoachStrategiesPrompt',
  input: {schema: AiCoachStrategiesInputSchema},
  output: {schema: AiCoachStrategiesOutputSchema},
  prompt: `You are an expert AI Trading Coach specializing in profit maximization for advanced users.
Your goal is to provide highly actionable investment strategies and sophisticated advice for a specific cryptocurrency pick.

Coin: {{{coinName}}}
Initial Rationale for Pick: {{{currentRationale}}}
Predicted Gain: {{{predictedGainPercentage}}}%
Entry Price Range: \${{{entryPriceRange.low}}} - \${{{entryPriceRange.high}}}
Exit Price Range: \${{{exitPriceRange.low}}} - \${{{exitPriceRange.high}}}
Estimated Duration: {{{estimatedDuration}}}
{{#if profitTarget}}User's Profit Target: \${{{profitTarget}}}{{/if}}
{{#if riskTolerance}}User's Risk Tolerance: {{{riskTolerance}}}{{/if}}

Based on the information above, provide the following with a strong focus on maximizing profit:
1.  **Coin-Specific Advice**: Offer advanced insights specific to {{{coinName}}}. Think about unique volatility patterns, upcoming catalysts (e.g., mainnet launch, token burn) that could be exploited, liquidity considerations for larger trades, or specific indicators that work well for this coin.
2.  **Investment Strategies (Profit Maximization Focus)**: Recommend 1 to 3 distinct investment strategies designed to maximize profit for {{{coinName}}}, considering its profile and the user's parameters. For each strategy:
    *   **Name**: A clear, compelling name (e.g., "Alpha Scalp & Compound", "Momentum Surge Ride", "Breakout & Hold for Multi-Targets").
    *   **Description**: Explain the strategy in detail, emphasizing how it targets profit maximization.
    *   **Reasoning**: Justify why this strategy is optimal for {{{coinName}}} in the current market context to achieve maximum gains. How does it leverage the predicted gain, entry/exit points, or duration for superior returns?
    *   **Optimal Buy Price**: (Optional) Suggest a specific, optimal buy price to enter the trade for this strategy. This should be a precise figure.
    *   **Target Sell Prices**: Provide at least one, preferably multiple, specific target sell prices. These could represent different levels for taking partial or full profits (e.g., initial target, secondary target, moonshot target).
    *   **Actionable Steps**: Provide 2-4 concrete, actionable steps. Examples: "Set a limit buy order at \${{{optimalBuyPrice}}}.", "Place take-profit orders at \${{{targetSellPrices.[0]}}} and \${{{targetSellPrices.[1]}}}.", "Monitor [specific indicator] for confirmation before entry."
    *   **Stop-Loss Suggestion**: (Optional) Provide a concrete stop-loss price or a strategy for setting one (e.g., "Set a stop-loss at \${some_price_level_based_on_support}", or "Use a 5% trailing stop-loss once in profit").
3.  **Overall Coach's Outlook (Profit Max Focus)**: Summarize your overall outlook for investing in {{{coinName}}} with the primary goal of maximizing profit. Include crucial risk management tips tailored for aggressive strategies (e.g., position sizing relative to conviction and risk, when to cut losses quickly, importance of not being greedy, how to adjust strategy if market conditions change).
4.  **Disclaimer**: Include the standard disclaimer.

Format the output strictly according to the AiCoachStrategiesOutputSchema. Ensure strategies are practical, well-explained, and focused on maximizing returns while managing associated risks. Be bold and intelligent in your suggestions.
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
      output.disclaimer = 'Remember, these AI-generated insights are for informational purposes and not financial advice. Cryptocurrency investments are subject to high market risk. Past performance is not indicative of future results. Always do your own research (DYOR).';
    }
    return output!;
  }
);

