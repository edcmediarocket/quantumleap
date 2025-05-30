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

const PriceRangeSchema = z.object({
  low: z.number().describe('The lower bound of the price range.'),
  high: z.number().describe('The upper bound of the price range.'),
});

const CandlestickDataPointSchema = z.object({
  time: z.string().describe("The date for the data point, format 'YYYY-MM-DD'."),
  open: z.number().describe('Opening price.'),
  high: z.number().describe('Highest price.'),
  low: z.number().describe('Lowest price.'),
  close: z.number().describe('Closing price.'),
});

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
    .describe('The estimated time to reach the profit target (e.g., \'1-3 days\', \'1 week\').'),
  entryPriceRange: PriceRangeSchema.describe('The suggested entry price range as an object with low and high numeric values.'),
  exitPriceRange: PriceRangeSchema.describe('The suggested exit price range as an object with low and high numeric values.'),
  optimalBuyPrice: z.number().optional().describe('A suggested specific optimal buy price within or near the entry range.'),
  targetSellPrices: z.array(z.number()).optional().describe('One or more specific target sell prices to consider for taking profits.'),
  tradeConfidence: z
    .number()
    .min(0).max(1)
    .describe('A number from 0 to 1 indicating the confidence in this trade.'),
  rationale: z.string().describe('A detailed rationale (at least 3-4 paragraphs, targeting an advanced user) behind recommending this coin. Cover technical and fundamental aspects, market sentiment, relevant news/events, potential catalysts, risks, and how it aligns with the user\'s risk tolerance and profit target to maximize gains.'),
  mockCandlestickData: z.array(CandlestickDataPointSchema).length(30).describe("A list of 30 mock daily candlestick data points (time, open, high, low, close) for this coin for the last 30 days leading up to a plausible recent date in 2025. The data should look plausible for a volatile cryptocurrency. 'time' should be a date string like 'YYYY-MM-DD'. Ensure prices are realistic for the coin type.")
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
  prompt: `You are an AI trading coach for advanced users. A user wants to reach a profit target of {{{profitTarget}}} USD.
The user's risk tolerance is {{{riskTolerance}}}.
Strive to provide the smartest, most accurate, and actionable advice possible to maximize their profit.

Based on current market conditions, recommend 3-5 coins to trade that could help the user reach their profit target.

For each recommended coin, provide:
1.  **Coin Name**: The full name of the coin and its ticker (e.g., Bitcoin (BTC)).
2.  **Estimated Gain Percentage**: The potential percentage profit.
3.  **Estimated Duration**: How long it might take to reach the target (e.g., "5-10 days", "2 weeks").
4.  **Entry Price Range**: As an object with 'low' and 'high' numeric values (e.g., { low: 50000, high: 50500 }).
5.  **Exit Price Range**: As an object with 'low' and 'high' numeric values (e.g., { low: 55000, high: 56000 }).
6.  **Optimal Buy Price**: (Optional) A specific suggested buy price that represents a particularly good entry point.
7.  **Target Sell Prices**: (Optional) One or more specific price targets for selling and taking profit.
8.  **Trade Confidence**: A score from 0.0 to 1.0.
9.  **Detailed Rationale**: An in-depth explanation (at least 3-4 paragraphs, targeting an advanced user) for this recommendation, including:
    *   Relevant technical analysis (support/resistance levels, chart patterns, indicators like RSI, MACD).
    *   Key fundamental factors (project developments, news, adoption, tokenomics).
    *   Current market sentiment and significant whale/social media activity.
    *   How it aligns with the user's risk tolerance and profit target, focusing on profit maximization.
    *   Potential catalysts for price movement and key risks or invalidation points.
10. **Mock Candlestick Data**: Generate a list of 30 mock daily candlestick data points (each an object with 'time' as 'YYYY-MM-DD', 'open', 'high', 'low', 'close' numeric values) for this coin, representing the last 30 days leading up to a plausible recent date in 2025 (e.g., if today is April 10, 2025, data should span roughly March 11, 2025 - April 10, 2025). This data must look plausible for a volatile cryptocurrency, showing realistic price fluctuations. Ensure the price levels in the mock data are appropriate for the type of coin being recommended.

Format the output strictly according to the RecommendCoinsForProfitTargetOutputSchema.
Ensure all numeric values are indeed numbers, not strings.
The mockCandlestickData array must contain exactly 30 data points, with dates in 2025.
Example for a single recommended coin:
{
  "coinName": "ExampleCoin (EXM)",
  "estimatedGain": 25.0,
  "estimatedDuration": "7-14 days",
  "entryPriceRange": {"low": 2.50, "high": 2.55},
  "exitPriceRange": {"low": 3.10, "high": 3.20},
  "optimalBuyPrice": 2.51,
  "targetSellPrices": [3.10, 3.15],
  "tradeConfidence": 0.75,
  "rationale": "Multi-paragraph detailed rationale targeting advanced users, covering TA, FA, market sentiment, profit maximization for user's goal...",
  "mockCandlestickData": [
    {"time": "2025-03-11", "open": 2.30, "high": 2.35, "low": 2.28, "close": 2.32},
    // ... 28 more data points ...
    {"time": "2025-04-10", "open": 2.52, "high": 2.56, "low": 2.51, "close": 2.55}
  ]
}
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
    if (!output || !output.recommendedCoins) {
        throw new Error("AI failed to generate valid coin recommendations.");
    }
    output.recommendedCoins.forEach(coin => {
      if (!coin.mockCandlestickData || coin.mockCandlestickData.length !== 30) {
         console.warn(`Mock candlestick data for ${coin.coinName} was invalid or missing. Generating default for 2025.`);
        coin.mockCandlestickData = Array(30).fill(null).map((_, i) => {
          const date = new Date(2025, 0, 1); // Start of 2025 for fallback
          date.setDate(date.getDate() + i - 29); // Create a sequence for the last 30 days
          const open = coin.entryPriceRange.low * (1 + (Math.random() - 0.5) * 0.1);
          const close = open * (1 + (Math.random() - 0.1) * 0.05);
          const high = Math.max(open, close) * (1 + Math.random() * 0.03);
          const low = Math.min(open, close) * (1 - Math.random() * 0.03);
          return {
            time: date.toISOString().split('T')[0], // YYYY-MM-DD
            open: parseFloat(open.toFixed(6)),
            high: parseFloat(high.toFixed(6)),
            low: parseFloat(low.toFixed(6)),
            close: parseFloat(close.toFixed(6)),
          };
        });
      } else {
         // Ensure dates are in 2025 if AI provided them
        coin.mockCandlestickData.forEach(dp => {
          if (!dp.time.startsWith('2025')) {
            console.warn(`Correcting date for ${coin.coinName} to 2025. Original: ${dp.time}`);
            const parts = dp.time.split('-');
            dp.time = `2025-${parts[1]}-${parts[2]}`;
          }
        });
      }
    });
    return output!;
  }
);
