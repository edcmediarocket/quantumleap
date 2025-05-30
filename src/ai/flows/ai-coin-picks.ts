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
      optimalBuyPrice: z.number().optional().describe('A suggested specific optimal buy price within or near the entry range.'),
      targetSellPrices: z.array(z.number()).optional().describe('One or more specific target sell prices to consider for taking profits.'),
      confidenceMeter: z.number().min(0).max(1).describe('A value between 0 and 1 indicating the confidence in this pick.'),
      rationale: z.string().describe('A detailed AI rationale (at least 3-4 paragraphs) for recommending this coin, targeting an advanced user. Include technical and fundamental analysis, market sentiment, whale activity, social media trends, and how these factors contribute to profit potential. Discuss potential catalysts and risks.'),
      estimatedDuration: z.string().describe('The estimated duration to reach the profit target (e.g., "2-5 days", "1 week").'),
      riskRoiGauge: z.number().min(0).max(1).describe('A value between 0 and 1 indicating the risk/ROI for this coin (higher means higher potential reward but also higher risk).'),
      mockCandlestickData: z.array(CandlestickDataPointSchema).length(30).describe("A list of 30 mock daily candlestick data points (time, open, high, low, close) for this coin for the last 30 days leading up to a plausible recent date in May 2025. The data should look plausible for a volatile cryptocurrency, showing some ups and downs. 'time' should be a date string like 'YYYY-MM-DD'. Ensure prices are realistic for the coin type (e.g., very small for meme coins, larger for established coins).")
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
  prompt: `You are a sophisticated cryptocurrency trading AI for advanced users.
Based on comprehensive real-time data analytics, whale activity tracking, deep market sentiment analysis, and trending social media data, recommend the top 3-5 coins predicted to yield quick profits.

Consider the user's profit target of {{{profitTarget}}} USD and their chosen trading strategy of {{{strategy}}}.
Strive to provide the smartest, most accurate, and actionable advice possible.

For each recommended coin, provide:
1.  **Coin Ticker**: The symbol (e.g., BTC, ETH).
2.  **Predicted Gain Percentage**: Estimated percentage increase.
3.  **Entry Price Range**: As an object with 'low' and 'high' numeric values (e.g., { low: 0.123, high: 0.125 }).
4.  **Exit Price Range**: As an object with 'low' and 'high' numeric values (e.g., { low: 0.130, high: 0.135 }).
5.  **Optimal Buy Price**: (Optional) A specific suggested buy price that represents a particularly good entry point.
6.  **Target Sell Prices**: (Optional) One or more specific price targets for selling and taking profit.
7.  **Confidence Meter**: A score from 0.0 to 1.0.
8.  **Detailed Rationale**: An in-depth explanation (at least 3-4 paragraphs, targeting an advanced user) covering:
    *   Key technical indicators supporting the pick (e.g., RSI, MACD, moving averages, chart patterns).
    *   Fundamental analysis (project updates, tokenomics, partnerships, roadmap).
    *   Current market sentiment (bullish/bearish/neutral with specific reasons).
    *   Notable whale activity or large transactions and their implications.
    *   Significant social media trends or discussions and their potential impact.
    *   How these factors combine to create a profit opportunity based on the chosen strategy.
    *   Potential catalysts that could drive price movement.
    *   Key risks or invalidation points for the trade idea.
9.  **Estimated Duration**: Timeframe to reach profit target (e.g., "3-7 days", "2 weeks").
10. **Risk/ROI Gauge**: A score from 0.0 to 1.0 reflecting risk vs. reward.
11. **Mock Candlestick Data**: Generate a list of 30 mock daily candlestick data points (each an object with 'time' as 'YYYY-MM-DD', 'open', 'high', 'low', 'close' numeric values) for this coin, representing the last 30 days leading up to a plausible recent date in May 2025 (e.g., if today is May 15, 2025, data should span roughly April 16, 2025 - May 15, 2025). This data must look plausible for a volatile cryptocurrency, showing realistic price fluctuations. Ensure the price levels in the mock data are appropriate for the type of coin being recommended.

Format the output strictly according to the AiCoinPicksOutputSchema.
Ensure all numeric values are indeed numbers, not strings.
The mockCandlestickData array must contain exactly 30 data points, with dates in May 2025 or an appropriate preceding month if spanning into April 2025.
Example for a single pick structure in the 'picks' array:
{
  "coin": "XYZ",
  "predictedGainPercentage": 15.5,
  "entryPriceRange": {"low": 1.20, "high": 1.25},
  "exitPriceRange": {"low": 1.38, "high": 1.45},
  "optimalBuyPrice": 1.21,
  "targetSellPrices": [1.38, 1.42, 1.45],
  "confidenceMeter": 0.85,
  "rationale": "Detailed multi-paragraph rationale here...",
  "estimatedDuration": "5-10 days",
  "riskRoiGauge": 0.7,
  "mockCandlestickData": [
    {"time": "2025-04-16", "open": 1.10, "high": 1.15, "low": 1.08, "close": 1.12},
    // ... 28 more data points ...
    {"time": "2025-05-15", "open": 1.22, "high": 1.26, "low": 1.21, "close": 1.25}
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
    if (!output || !output.picks) {
        throw new Error("AI failed to generate valid coin picks.");
    }
    output.picks.forEach(pick => {
      if (!pick.mockCandlestickData || pick.mockCandlestickData.length !== 30) {
        console.warn(`Mock candlestick data for ${pick.coin} was invalid or missing. Generating default for May 2025.`);
        const endDate = new Date(2025, 4, 15); // Target May 15, 2025 (month is 0-indexed for May)
        pick.mockCandlestickData = Array(30).fill(null).map((_, i) => {
          const date = new Date(endDate);
          date.setDate(endDate.getDate() - (29 - i)); // Generate 30 days leading up to endDate
          const open = pick.entryPriceRange.low * (1 + (Math.random() - 0.5) * 0.1);
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
        // Ensure dates are in 2025 if AI provided them, ideally around May
        pick.mockCandlestickData.forEach(dp => {
          if (!dp.time || !dp.time.startsWith('2025')) {
            console.warn(`Correcting date for ${pick.coin} to 2025. Original: ${dp.time}`);
            // Attempt to preserve month/day if valid, otherwise default to a sequence in May 2025
            const parts = dp.time ? dp.time.split('-') : [];
            if (parts.length === 3 && !isNaN(parseInt(parts[1])) && !isNaN(parseInt(parts[2]))) {
               dp.time = `2025-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else {
               const fallbackEndDate = new Date(2025, 4, 15); 
               const fallbackDate = new Date(fallbackEndDate);
               fallbackDate.setDate(fallbackEndDate.getDate() - (pick.mockCandlestickData.indexOf(dp) % 30) ); // Distribute over May
               dp.time = fallbackDate.toISOString().split('T')[0];
            }
          }
        });
      }
    });
    return output!;
  }
);
