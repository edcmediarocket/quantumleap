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
  time: z.string().describe("Date (YYYY-MM-DD)."),
  open: z.number().describe('Open price.'),
  high: z.number().describe('High price.'),
  low: z.number().describe('Low price.'),
  close: z.number().describe('Close price.'),
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
      coin: z.string().describe('Coin ticker.'),
      predictedGainPercentage: z.number().describe('Predicted % gain.'),
      entryPriceRange: PriceRangeSchema.describe('Entry price range (low/high).'),
      exitPriceRange: PriceRangeSchema.describe('Exit price range (low/high).'),
      optimalBuyPrice: z.number().optional().describe('Optimal buy price (optional).'),
      targetSellPrices: z.array(z.number()).optional().describe('Target sell prices (optional array).'),
      confidenceMeter: z.number().describe('Confidence score (0-1).'), // Removed .min(0).max(1)
      rationale: z.string().describe('Advanced rationale: TA, FA, sentiment, whale/social, catalysts, risks. Profit focus.'),
      estimatedDuration: z.string().describe('Estimated duration to profit.'),
      riskRoiGauge: z.number().describe('Risk/ROI score (0-1).'), // Removed .min(0).max(1)
      mockCandlestickData: z.array(CandlestickDataPointSchema).length(30).describe("30 mock daily OHLC data points (May 2025). Time: YYYY-MM-DD. Plausible & realistic prices.")
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
1.  **Coin Ticker (coin)**: The symbol (e.g., BTC, ETH).
2.  **Predicted Gain Percentage (predictedGainPercentage)**: Estimated percentage increase.
3.  **Entry Price Range (entryPriceRange)**: Object with 'low' and 'high' (e.g., { low: 0.123, high: 0.125 }).
4.  **Exit Price Range (exitPriceRange)**: Object with 'low' and 'high' (e.g., { low: 0.130, high: 0.135 }).
5.  **Optimal Buy Price (optimalBuyPrice)**: (Optional) Specific suggested buy price.
6.  **Target Sell Prices (targetSellPrices)**: (Optional) Array of specific target sell prices.
7.  **Confidence Meter (confidenceMeter)**: Score 0.0 to 1.0.
8.  **Detailed Rationale (rationale)**: In-depth (3-4 paragraphs, advanced user focus) covering: TA (RSI, MACD, patterns), FA (updates, tokenomics, news), market sentiment, whale activity, social media trends, profit opportunity synthesis, catalysts, risks.
9.  **Estimated Duration (estimatedDuration)**: Timeframe (e.g., "3-7 days").
10. **Risk/ROI Gauge (riskRoiGauge)**: Score 0.0 to 1.0.
11. **Mock Candlestick Data (mockCandlestickData)**: Exactly 30 daily OHLC data points for May 2025 (e.g., "2025-05-15"). Plausible, volatile crypto data. Realistic prices. Each point: {time: 'YYYY-MM-DD', open: number, high: number, low: number, close: number}.

Format output strictly as AiCoinPicksOutputSchema. Numeric values must be numbers.
Example for a single pick:
{
  "coin": "XYZ",
  "predictedGainPercentage": 15.5,
  "entryPriceRange": {"low": 1.20, "high": 1.25},
  "exitPriceRange": {"low": 1.38, "high": 1.45},
  "optimalBuyPrice": 1.21,
  "targetSellPrices": [1.38, 1.42, 1.45],
  "confidenceMeter": 0.85,
  "rationale": "Detailed rationale...",
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
      if (pick.confidenceMeter === undefined) pick.confidenceMeter = 0.5;
      if (pick.riskRoiGauge === undefined) pick.riskRoiGauge = 0.5;

      if (!pick.mockCandlestickData || pick.mockCandlestickData.length !== 30) {
        console.warn(`Mock candlestick data for ${pick.coin} was invalid or missing. Generating default 30 points for May 2025.`);
        const endDate = new Date(2025, 4, 15); // Target May 15, 2025 (month is 0-indexed for May)
        pick.mockCandlestickData = Array(30).fill(null).map((_, i) => {
          const date = new Date(endDate);
          date.setDate(endDate.getDate() - (29 - i)); // Generate 30 days leading up to endDate
          const basePrice = pick.entryPriceRange && typeof pick.entryPriceRange.low === 'number' ? pick.entryPriceRange.low : 1;
          const open = basePrice * (1 + (Math.random() - 0.5) * 0.1);
          const close = open * (1 + (Math.random() - 0.1) * 0.05);
          const high = Math.max(open, close) * (1 + Math.random() * 0.03);
          const low = Math.min(open, close) * (1 - Math.random() * 0.03);
          return {
            time: date.toISOString().split('T')[0], // YYYY-MM-DD
            open: parseFloat(open.toPrecision(6)),
            high: parseFloat(high.toPrecision(6)),
            low: parseFloat(low.toPrecision(6)),
            close: parseFloat(close.toPrecision(6)),
          };
        });
      } else {
        // Ensure dates are in 2025 if AI provided them, ideally around May
        pick.mockCandlestickData.forEach((dp, index) => {
          if (!dp.time || !dp.time.startsWith('2025')) {
            console.warn(`Correcting date for ${pick.coin} to 2025. Original: ${dp.time}`);
            const parts = dp.time ? dp.time.split('-') : [];
            if (parts.length === 3 && !isNaN(parseInt(parts[1])) && !isNaN(parseInt(parts[2]))) {
               let month = parseInt(parts[1]);
               let day = parseInt(parts[2]);
               if (month < 1 || month > 12 || day < 1 || day > 31) { // Basic validation
                  const fallbackEndDate = new Date(2025, 4, 15); 
                  const fallbackDate = new Date(fallbackEndDate);
                  fallbackDate.setDate(fallbackEndDate.getDate() - (29 - (index % 30)) );
                  dp.time = fallbackDate.toISOString().split('T')[0];
               } else {
                 dp.time = `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
               }
            } else {
               const fallbackEndDate = new Date(2025, 4, 15); 
               const fallbackDate = new Date(fallbackEndDate);
               fallbackDate.setDate(fallbackEndDate.getDate() - (29-(index % 30)) ); 
               dp.time = fallbackDate.toISOString().split('T')[0];
            }
          }
          // Ensure OHLC values are valid numbers and high >= low etc.
          const o = parseFloat(Number(dp.open || 0).toPrecision(6));
          let h = parseFloat(Number(dp.high || 0).toPrecision(6));
          let l = parseFloat(Number(dp.low || 0).toPrecision(6));
          const c = parseFloat(Number(dp.close || 0).toPrecision(6));

          dp.open = o;
          dp.close = c;
          
          const maxOC = Math.max(o, c);
          const minOC = Math.min(o, c);

          dp.high = Math.max(maxOC, h); 
          dp.low = Math.min(minOC, l);   

          if (dp.high < dp.low) { 
             const temp = dp.high;
             dp.high = dp.low;
             dp.low = temp;
             if (dp.high === dp.low && dp.high === 0) { 
                const basePrice = pick.entryPriceRange && typeof pick.entryPriceRange.low === 'number' ? pick.entryPriceRange.low : 0.000001;
                dp.high = basePrice * (1 + Math.random() * 0.1);
                dp.low = basePrice;
             }
          }
          dp.open = Math.max(dp.low, Math.min(dp.high, o));
          dp.close = Math.max(dp.low, Math.min(dp.high, c));
        });
      }
    });
    return output!;
  }
);

