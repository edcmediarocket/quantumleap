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
      coin: z.string().describe('The ticker symbol of the recommended coin.'),
      predictedGainPercentage: z.number().describe('The predicted percentage gain for this coin.'),
      entryPriceRange: z.string().describe('The recommended entry price range.'),
      exitPriceRange: z.string().describe('The recommended exit price range.'),
      confidenceMeter: z.number().describe('A value between 0 and 1 indicating the confidence in this pick.'),
      rationale: z.string().describe('The AI rationale for recommending this coin.'),
      estimatedDuration: z.string().describe('The estimated duration to reach the profit target.'),
      riskRoiGauge: z.number().describe('A value between 0 and 1 indicating the risk/ROI for this coin.'),
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
  prompt: `Based on real-time data analytics, whale activity, market sentiment, and social media trends, recommend the top 3-5 coins predicted to yield quick profits.

  Consider a profit target of {{{profitTarget}}} USD and a trading strategy of {{{strategy}}}.

  Format the output as a JSON array of coin picks, including the coin ticker, predicted gain percentage, entry/exit price ranges, a confidence meter (0-1), a brief AI rationale, estimated duration to reach the profit target, and a risk/ROI gauge (0-1).`,
});

const aiCoinPicksFlow = ai.defineFlow(
  {
    name: 'aiCoinPicksFlow',
    inputSchema: AiCoinPicksInputSchema,
    outputSchema: AiCoinPicksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
