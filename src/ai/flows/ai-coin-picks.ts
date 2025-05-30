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
      entryPriceRange: PriceRangeSchema.describe('The recommended entry price range as an object with low and high values.'),
      exitPriceRange: PriceRangeSchema.describe('The recommended exit price range as an object with low and high values.'),
      confidenceMeter: z.number().min(0).max(1).describe('A value between 0 and 1 indicating the confidence in this pick.'),
      rationale: z.string().describe('A detailed AI rationale for recommending this coin, including technical and fundamental analysis, market sentiment, whale activity, and social media trends. Provide at least 3-4 paragraphs.'),
      estimatedDuration: z.string().describe('The estimated duration to reach the profit target (e.g., "2-5 days", "1 week").'),
      riskRoiGauge: z.number().min(0).max(1).describe('A value between 0 and 1 indicating the risk/ROI for this coin (higher means higher potential reward but also higher risk).'),
      mockCandlestickData: z.array(CandlestickDataPointSchema).length(30).describe("A list of 30 mock daily candlestick data points (time, open, high, low, close) for this coin for the last 30 days. The data should look plausible for a volatile cryptocurrency, showing some ups and downs. 'time' should be a date string like 'YYYY-MM-DD'. Ensure prices are realistic for the coin type (e.g., very small for meme coins, larger for established coins).")
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
  prompt: `You are a sophisticated cryptocurrency trading AI.
Based on comprehensive real-time data analytics, whale activity tracking, deep market sentiment analysis, and trending social media data, recommend the top 3-5 coins predicted to yield quick profits.

Consider the user's profit target of {{{profitTarget}}} USD and their chosen trading strategy of {{{strategy}}}.

For each recommended coin, provide:
1.  **Coin Ticker**: The symbol (e.g., BTC, ETH).
2.  **Predicted Gain Percentage**: Estimated percentage increase.
3.  **Entry Price Range**: As an object with 'low' and 'high' numeric values (e.g., { low: 0.123, high: 0.125 }).
4.  **Exit Price Range**: As an object with 'low' and 'high' numeric values (e.g., { low: 0.130, high: 0.135 }).
5.  **Confidence Meter**: A score from 0.0 to 1.0.
6.  **Detailed Rationale**: An in-depth explanation (at least 3-4 paragraphs) covering:
    *   Key technical indicators supporting the pick.
    *   Fundamental analysis (project updates, tokenomics, partnerships).
    *   Current market sentiment (bullish/bearish/neutral with reasons).
    *   Notable whale activity or large transactions.
    *   Significant social media trends or discussions.
7.  **Estimated Duration**: Timeframe to reach profit target (e.g., "3-7 days", "2 weeks").
8.  **Risk/ROI Gauge**: A score from 0.0 to 1.0 reflecting risk vs. reward.
9.  **Mock Candlestick Data**: Generate a list of 30 mock daily candlestick data points (each an object with 'time' as 'YYYY-MM-DD', 'open', 'high', 'low', 'close' numeric values) for this coin, representing the last 30 days. This data must look plausible for a volatile cryptocurrency, showing realistic price fluctuations. Ensure the price levels in the mock data are appropriate for the type of coin being recommended (e.g., very small numbers for meme coins like SHIB, larger numbers for coins like BTC).

Format the output strictly according to the AiCoinPicksOutputSchema.
Ensure all numeric values are indeed numbers, not strings.
The mockCandlestickData array must contain exactly 30 data points.
Example for a single pick structure in the 'picks' array:
{
  "coin": "XYZ",
  "predictedGainPercentage": 15.5,
  "entryPriceRange": {"low": 1.20, "high": 1.25},
  "exitPriceRange": {"low": 1.38, "high": 1.45},
  "confidenceMeter": 0.85,
  "rationale": "Detailed multi-paragraph rationale here...",
  "estimatedDuration": "5-10 days",
  "riskRoiGauge": 0.7,
  "mockCandlestickData": [
    {"time": "2023-10-01", "open": 1.10, "high": 1.15, "low": 1.08, "close": 1.12},
    // ... 28 more data points ...
    {"time": "2023-10-30", "open": 1.22, "high": 1.26, "low": 1.21, "close": 1.25}
  ]
}
`,
});

const aiCoinPicksFlow = ai.defineFlow(
  {
    name: 'aiCoinPicksFlow',
    inputSchema: AiCoinPicksInputSchema,
    outputSchema: AiCoinPicksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure output is not null and matches the schema, especially the nested structures.
    if (!output || !output.picks) {
        throw new Error("AI failed to generate valid coin picks.");
    }
    // Basic validation for mock data for each pick
    output.picks.forEach(pick => {
      if (!pick.mockCandlestickData || pick.mockCandlestickData.length !== 30) {
        // Attempt to provide some default mock data if generation fails partially
        console.warn(`Mock candlestick data for ${pick.coin} was invalid or missing. Generating default.`);
        pick.mockCandlestickData = Array(30).fill(null).map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          const open = pick.entryPriceRange.low * (1 + (Math.random() - 0.5) * 0.1); // Base on entry price
          const close = open * (1 + (Math.random() - 0.1) * 0.05);
          const high = Math.max(open, close) * (1 + Math.random() * 0.03);
          const low = Math.min(open, close) * (1 - Math.random() * 0.03);
          return {
            time: date.toISOString().split('T')[0],
            open: parseFloat(open.toFixed(6)),
            high: parseFloat(high.toFixed(6)),
            low: parseFloat(low.toFixed(6)),
            close: parseFloat(close.toFixed(6)),
          };
        });
      }
    });
    return output!;
  }
);

