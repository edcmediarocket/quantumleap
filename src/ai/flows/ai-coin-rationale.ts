
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
  coinName: z.string().describe('The name of the cryptocurrency coin.'),
  predictedGain: z.number().describe('The predicted percentage gain for the coin.'),
  entryPriceRange: z.string().describe('The recommended entry price range for the coin.'),
  exitPriceRange: z.string().describe('The recommended exit price range for the coin.'),
  marketSentiment: z.string().describe('The current market sentiment for the coin (e.g., bullish, bearish, neutral).'),
  whaleActivity: z.string().describe('A summary of recent whale activity related to the coin.'),
  socialMediaTrends: z.string().describe('A summary of recent social media trends and discussions about the coin.'),
});
export type CoinRationaleInput = z.infer<typeof CoinRationaleInputSchema>;

const CoinRationaleOutputSchema = z.object({
  rationale: z.string().describe('A brief, easy-to-understand rationale for the coin recommendation.'),
});
export type CoinRationaleOutput = z.infer<typeof CoinRationaleOutputSchema>;

export async function coinRationale(input: CoinRationaleInput): Promise<CoinRationaleOutput> {
  return coinRationaleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'coinRationalePrompt',
  input: {schema: CoinRationaleInputSchema},
  output: {schema: CoinRationaleOutputSchema},
  prompt: `You are an AI assistant providing rationales for cryptocurrency coin recommendations.

  Given the following information about a coin, generate a brief, easy-to-understand rationale for why this coin is being recommended.  Focus on the key factors that make this coin a good pick right now.

  Coin Name: {{{coinName}}}
  Predicted Gain: {{{predictedGain}}}%
  Entry Price Range: {{{entryPriceRange}}}
  Exit Price Range: {{{exitPriceRange}}}
  Market Sentiment: {{{marketSentiment}}}
  Whale Activity: {{{whaleActivity}}}
  Social Media Trends: {{{socialMediaTrends}}}
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
    return output!;
  }
);

