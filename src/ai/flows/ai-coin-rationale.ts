
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a rationale for a coin recommendation.
 *
 * - coinRationale - A function that generates the coin rationale.
 * - CoinRationaleInput - The input type for the coinRationale function.
 * - CoinRationaleOutput - The return type for the coinRationale function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CoinRationaleInputSchema = z.object({
  coinName: z.string(),
  predictedGain: z.number(),
  entryPriceRange: z.string(), // Example: "$0.10 - $0.12"
  exitPriceRange: z.string(), // Example: "$0.15 - $0.18"
  marketSentiment: z.string(), // e.g., bullish, bearish, neutral
  whaleActivity: z.string(), // Summary of recent whale activity
  socialMediaTrends: z.string(), // Summary of recent social media trends
});
export type CoinRationaleInput = z.infer<typeof CoinRationaleInputSchema>;

const CoinRationaleOutputSchema = z.object({
  rationale: z.string(), // Brief, easy-to-understand rationale.
});
export type CoinRationaleOutput = z.infer<typeof CoinRationaleOutputSchema>;

export async function coinRationale(input: CoinRationaleInput): Promise<CoinRationaleOutput> {
  return coinRationaleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'coinRationalePrompt',
  input: {schema: CoinRationaleInputSchema},
  output: {schema: CoinRationaleOutputSchema},
  prompt: `You are an elite AI crypto investment coach. Your task is to provide a concise, data-driven rationale for why {{{coinName}}} is a notable pick right now.
Your analysis should implicitly consider factors like:
-   Volatility patterns and potential for movement.
-   Current sentiment from social media and news.
-   Any significant whale activity or on-chain signals.
-   Alignment with trending narratives, if applicable.
-   General market cycle timing or momentum.

Given the following information:
-   Coin Name: {{{coinName}}}
-   Predicted Gain: {{{predictedGain}}}%
-   Entry Price Range: {{{entryPriceRange}}}
-   Exit Price Range: {{{exitPriceRange}}}
-   Market Sentiment: {{{marketSentiment}}}
-   Whale Activity: {{{whaleActivity}}}
-   Social Media Trends: {{{socialMediaTrends}}}

Generate a brief (2-4 sentences) rationale for {{{coinName}}}. Focus on the KEY reasons for its current potential, making it easy to understand yet insightful.
Your tone should be confident and data-driven.
Output strictly according to CoinRationaleOutputSchema.
`,
});

const coinRationaleFlow = ai.defineFlow(
  {
    name: 'coinRationaleFlow',
    inputSchema: CoinRationaleInputSchema,
    outputSchema: CoinRationaleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.rationale) {
      return { rationale: `AI analysis for ${input.coinName} suggests potential based on market signals. Predicted gain: ${input.predictedGain}%. DYOR.` };
    }
    return output;
  }
);
