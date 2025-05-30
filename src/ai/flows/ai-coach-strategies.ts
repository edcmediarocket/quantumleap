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
  name: z.string().describe('The name of the investment strategy (e.g., "Dollar-Cost Averaging", "Swing Trading Confirmation").'),
  description: z.string().describe('A detailed description of the strategy.'),
  reasoning: z.string().describe('Why this strategy is suitable for this specific coin and current context, considering its volatility, potential, and the user\'s parameters if available.'),
  actionableSteps: z.array(z.string()).describe('A few actionable steps for implementing this strategy.'),
});

const AiCoachStrategiesOutputSchema = z.object({
  coinSpecificAdvice: z.string().describe("General advice tailored to this coin's characteristics (e.g., known volatility, upcoming events)."),
  investmentStrategies: z.array(InvestmentStrategySchema).min(1).max(3).describe('An array of 1-3 recommended investment strategies.'),
  overallCoachSOutlook: z.string().describe('The AI coach\'s overall outlook and final thoughts for investing in this coin, including risk management tips.'),
  disclaimer: z.string().describe('A brief disclaimer that this is AI-generated advice and not financial gospel.'),
});
export type AiCoachStrategiesOutput = z.infer<typeof AiCoachStrategiesOutputSchema>;

export async function aiCoachStrategies(input: AiCoachStrategiesInput): Promise<AiCoachStrategiesOutput> {
  return aiCoachStrategiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCoachStrategiesPrompt',
  input: {schema: AiCoachStrategiesInputSchema},
  output: {schema: AiCoachStrategiesOutputSchema},
  prompt: `You are an expert AI Trading Coach. Your goal is to provide actionable investment strategies and advice for a specific cryptocurrency pick.

Coin: {{{coinName}}}
Initial Rationale for Pick: {{{currentRationale}}}
Predicted Gain: {{{predictedGainPercentage}}}%
Entry Price Range: \${{{entryPriceRange.low}}} - \${{{entryPriceRange.high}}}
Exit Price Range: \${{{exitPriceRange.low}}} - \${{{exitPriceRange.high}}}
Estimated Duration: {{{estimatedDuration}}}
{{#if profitTarget}}User's Profit Target: \${{{profitTarget}}}{{/if}}
{{#if riskTolerance}}User's Risk Tolerance: {{{riskTolerance}}}{{/if}}

Based on the information above:
1.  **Coin-Specific Advice**: Provide some general advice tailored to the known characteristics of {{{coinName}}} (e.g., "Given its high volatility, consider setting tighter stop-losses." or "Watch out for major news expected next month regarding X project update.").
2.  **Investment Strategies**: Recommend 1 to 3 distinct investment strategies suitable for {{{coinName}}} given its profile and the user's parameters (if available). For each strategy:
    *   **Name**: A clear name (e.g., "Aggressive Entry & Scalp", "Conservative DCA Accumulation").
    *   **Description**: Explain the strategy in detail.
    *   **Reasoning**: Justify why this strategy is appropriate for {{{coinName}}} and the current market context. How does it leverage the predicted gain, entry/exit points, or duration?
    *   **Actionable Steps**: Provide 2-3 concrete, actionable steps a user can take to implement this strategy.
3.  **Overall Coach's Outlook**: Summarize your overall outlook for investing in {{{coinName}}}. Include crucial risk management tips (e.g., position sizing, stop-loss strategies, not investing more than one can afford to lose).
4.  **Disclaimer**: Include a short disclaimer: "Remember, these AI-generated insights are for informational purposes and not financial advice. Cryptocurrency investments are subject to high market risk."

Format the output strictly according to the AiCoachStrategiesOutputSchema. Ensure the strategies are practical and well-explained.
Focus on providing high-quality, insightful coaching.
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
    return output!;
  }
);
