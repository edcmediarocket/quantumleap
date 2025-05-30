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

const RecommendCoinsForProfitTargetInputSchema = z.object({
  profitTarget: z.number().describe('The desired profit target in USD.'),
  riskTolerance: z
    .enum(['low', 'medium', 'high'])
    .describe('The user\'s risk tolerance: low, medium, or high.'),
});
export type RecommendCoinsForProfitTargetInput = z.infer<
  typeof RecommendCoinsForProfitTargetInputSchema
>;

const RecommendedCoinSchema = z.object({
  coinName: z.string().describe('The name of the recommended coin.'),
  estimatedGain: z.number().describe('The estimated percentage gain.'),
  estimatedDuration: z
    .string()
    .describe('The estimated time to reach the profit target (e.g., \'1-3 days\').'),
  entryPriceRange: z
    .string()
    .describe('The suggested entry price range for the coin.'),
  exitPriceRange: z.string().describe('The suggested exit price range for the coin.'),
  tradeConfidence: z
    .number()
    .describe('A number from 0 to 1 indicating the confidence in this trade.'),
  rationale: z.string().describe('The rationale behind recommending this coin.'),
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
  prompt: `You are an AI trading coach. A user wants to reach a profit target of {{{profitTarget}}} USD. The user's risk tolerance is {{{riskTolerance}}}. Based on current market conditions, recommend 3-5 coins to trade that would help the user reach their profit target. Also estimate the time it will take to reach their target.

      The response should be formatted as a JSON array of objects with the following keys:

      - coinName: The name of the recommended coin.
      - estimatedGain: The estimated percentage gain.
      - estimatedDuration: The estimated time to reach the profit target (e.g., '1-3 days').
      - entryPriceRange: The suggested entry price range for the coin.
      - exitPriceRange: The suggested exit price range for the coin.
      - tradeConfidence: A number from 0 to 1 indicating the confidence in this trade.
      - rationale: The rationale behind recommending this coin.
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
    return output!;
  }
);
