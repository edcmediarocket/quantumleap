
'use server';
/**
 * @fileOverview AI meme coin quick flip finder. Recommends meme coins with high short-term explosive potential.
 *
 * - memeCoinQuickFlip - A function that identifies potential meme coin quick flips.
 * - MemeCoinQuickFlipInput - The input type for the memeCoinQuickFlip function.
 * - MemeCoinQuickFlipOutput - The return type for the memeCoinQuickFlip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PriceRangeSchema = z.object({
  low: z.number().describe('Lower price bound.'),
  high: z.number().describe('Upper price bound.'),
});

// Simplified for meme coins - descriptions removed
const CandlestickDataPointSchema = z.object({
  time: z.string(),      // Expected: YYYY-MM-DD
  open: z.number(),    // Opening price
  high: z.number(),    // Highest price
  low: z.number(),     // Lowest price
  close: z.number(),   // Closing price
});


const MemeCoinQuickFlipInputSchema = z.object({
  trigger: z.boolean().default(true).describe('Trigger for meme coin scan.'),
});
export type MemeCoinQuickFlipInput = z.infer<typeof MemeCoinQuickFlipInputSchema>;

const MemeCoinQuickFlipOutputSchema = z.object({
  picks: z.array(
    z.object({
      coinName: z.string().describe('Name & ticker'),
      predictedPumpPotential: z.string().describe('Pump potential'), // e.g., "High", "Very High"
      suggestedBuyInWindow: z.string().describe('Buy window'), // e.g., "Next 1-4 hours"
      quickFlipSellTargetPercentage: z.number().describe('Target % gain'), // e.g., 50 for 50%
      entryPriceRange: PriceRangeSchema.describe('Entry price range'),
      confidenceScore: z.number().describe('Confidence (0-1)'),
      rationale: z.string().describe('Rationale & risk. 2-3 paras. Incl: "Highly speculative," "Extreme risk," "Rug pull," "DYOR."'),
      riskLevel: z.enum(["Extreme", "Very High"]).default("Extreme").describe('Risk level'),
      mockCandlestickData: z.array(CandlestickDataPointSchema).length(10).describe("10 mock daily OHLC, 2025. Volatile, low prices."), // Reduced to 10
      estimatedDuration: z.string().describe('Est. duration (speculative)'),
      predictedGainPercentage: z.number().describe('Predicted % gain'), // Should mirror quickFlipSellTargetPercentage
      exitPriceRange: PriceRangeSchema.describe('Exit price range (calc.)'),
    })
  ).describe('Array of meme coin quick flip picks.'),
  overallDisclaimer: z.string().default("Meme coins are EXTREMELY RISKY and highly speculative. Prices are driven by hype and can collapse to zero without warning. Invest only what you are absolutely prepared to lose. This is not financial advice. DYOR!").describe("Overall risk disclaimer.")
});
export type MemeCoinQuickFlipOutput = z.infer<typeof MemeCoinQuickFlipOutputSchema>;

export async function memeCoinQuickFlip(input: MemeCoinQuickFlipInput): Promise<MemeCoinQuickFlipOutput> {
  return memeCoinQuickFlipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'memeCoinQuickFlipPrompt',
  input: {schema: MemeCoinQuickFlipInputSchema},
  output: {schema: MemeCoinQuickFlipOutputSchema},
  prompt: `You are "Meme Coin Hunter AI," an advanced AI specializing in identifying HIGH-RISK, HIGH-REWARD meme coins that have the potential to "explode" in price for a quick flip profit. Your targets are highly speculative.

The user is looking for meme coins to buy very low and sell almost immediately for substantial profits. Emphasize the EXTREME VOLATILITY and RISK.

For each potential meme coin (recommend 2-4):
1.  **Coin Name**: Full name and ticker if possible (e.g., PepeCoin (PEPE), TurboToad (TOAD)). Matches 'Name & ticker' schema.
2.  **Predicted Pump Potential**: (e.g., "High", "Very High", "Extreme"). THIS IS A REQUIRED FIELD. Matches 'Pump potential' schema.
3.  **Suggested Buy-In Window**: (e.g., "Next 1-4 hours - monitor closely!", "ASAP - extreme vigilance needed!"). Matches 'Buy window' schema.
4.  **Quick Flip Sell Target Percentage**: A specific percentage gain target for a quick exit (e.g., 50 for 50% gain, 200 for 200% gain). This will be used for 'predictedGainPercentage'. Matches 'Target % gain' schema.
5.  **Entry Price Range**: An object with 'low' and 'high' numeric values for the current approximate entry price. These prices should be VERY SMALL (e.g., {low: 0.00000012, high: 0.00000015}). Matches 'Entry price range' schema.
6.  **Confidence Score**: 0.0 to 1.0 (reflecting high uncertainty despite potential). THIS IS A REQUIRED FIELD. Matches 'Confidence (0-1)' schema.
7.  **Rationale (CRITICAL EMPHASIS ON RISK)**: 2-3 paragraphs.
    *   Focus on: social media hype (Twitter, Telegram, Reddit), influencer mentions, new/imminent CEX/DEX listings, extremely low market cap, tokenomics (supply, burn), strong narrative, high community engagement, recent volume spikes.
    *   MANDATORY: Include strong warnings like "This is a degen play," "EXTREMELY SPECULATIVE," "HIGH RISK OF TOTAL CAPITAL LOSS," "Possibility of rug pull or scam is significant," "Only invest funds you can afford to lose entirely," "Thoroughly Do Your Own Research (DYOR) before considering." Matches 'Rationale & risk. 2-3 paras. Incl: "Highly speculative," "Extreme risk," "Rug pull," "DYOR."' schema.
8.  **Risk Level**: Must be "Extreme" or "Very High". THIS IS A REQUIRED FIELD. Matches 'Risk level' schema.
9.  **Mock Candlestick Data**: Generate 10 mock daily candlestick data points (time, open, high, low, close) for the last 10 days leading up to a plausible RECENT date in 2025. Data must show EXTREME volatility and very low prices typical of meme coins (e.g., values like 0.000000XX). Time as 'YYYY-MM-DD'. Matches '10 mock daily OHLC, 2025. Volatile, low prices.' schema.
10. **Estimated Duration**: Speculative timeframe for the flip (e.g., "Few hours to 2 days"). Matches 'Est. duration (speculative)' schema.

Based on the 'Entry Price Range' and 'Quick Flip Sell Target Percentage', calculate and provide an 'Exit Price Range' (low and high). For example, if entry is {low: 0.1, high: 0.11} and target is 50%, exit would be {low: 0.15, high: 0.165}. Matches 'Exit price range (calc.)' schema.
Also, set 'predictedGainPercentage' to be the same as 'Quick Flip Sell Target Percentage'. Matches 'Predicted % gain' schema.

Output format MUST strictly follow MemeCoinQuickFlipOutputSchema.
Provide an 'overallDisclaimer' as defined in the schema ('Overall risk disclaimer.').
Ensure all numeric values are numbers. Dates in mock data MUST be in 2025. Mock candlestick data array must contain exactly 10 data points.
Mock candlestick data fields are time (string 'YYYY-MM-DD'), open (number), high (number), low (number), close (number).
`,
});

const memeCoinQuickFlipFlow = ai.defineFlow(
  {
    name: 'memeCoinQuickFlipFlow',
    inputSchema: MemeCoinQuickFlipInputSchema,
    outputSchema: MemeCoinQuickFlipOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.picks) {
        throw new Error("AI failed to generate valid meme coin picks.");
    }
    output.picks.forEach(pick => {
      if (!pick.predictedPumpPotential) {
        pick.predictedPumpPotential = "High";
        console.warn(`Predicted pump potential for ${pick.coinName} was missing. Defaulted to "High".`);
      }
      
      pick.predictedGainPercentage = pick.quickFlipSellTargetPercentage;
      const gainFactor = 1 + pick.quickFlipSellTargetPercentage / 100;
      pick.exitPriceRange = {
        low: parseFloat((pick.entryPriceRange.low * gainFactor).toPrecision(6)),
        high: parseFloat((pick.entryPriceRange.high * gainFactor).toPrecision(6)),
      };
      
      if (!pick.mockCandlestickData || pick.mockCandlestickData.length !== 10) { // Check for 10 points
        console.warn(`Mock candlestick data for ${pick.coinName} was invalid or missing. Generating default 10 points for 2025.`);
        pick.mockCandlestickData = Array(10).fill(null).map((_, i) => {  // Generate 10 points
          const date = new Date(2025, 0, 10); // Base date for fallback
          date.setDate(date.getDate() + i - 9); // Create a sequence for the last 10 days
          const basePrice = pick.entryPriceRange && typeof pick.entryPriceRange.low === 'number' ? pick.entryPriceRange.low : 0.000001;
          const open = basePrice * (1 + (Math.random() - 0.5) * 0.8); 
          const close = open * (1 + (Math.random() - 0.5) * 0.7);
          const high = Math.max(open, close) * (1 + Math.random() * 0.5);
          const low = Math.min(open, close) * (1 - Math.random() * 0.5);
          return {
            time: date.toISOString().split('T')[0],
            open: parseFloat(open.toPrecision(6)),
            high: parseFloat(high.toPrecision(6)),
            low: parseFloat(low.toPrecision(6)),
            close: parseFloat(close.toPrecision(6)),
          };
        });
      } else {
        pick.mockCandlestickData.forEach(dp => {
          if (!dp.time || !dp.time.startsWith('2025')) {
            console.warn(`Correcting date for ${pick.coinName} to 2025. Original or missing: ${dp.time}`);
            const parts = dp.time ? dp.time.split('-') : [];
            if (parts.length === 3 && !isNaN(parseInt(parts[1])) && !isNaN(parseInt(parts[2]))) {
               dp.time = `2025-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else {
               const fallbackDate = new Date(2025,0,1); 
               fallbackDate.setDate(fallbackDate.getDate() + (pick.mockCandlestickData?.indexOf(dp) ?? 0) - 9); // Adjust for 10 days
               dp.time = fallbackDate.toISOString().split('T')[0];
            }
          }
          
          const o = parseFloat(Number(dp.open || 0).toPrecision(6));
          const h = parseFloat(Number(dp.high || 0).toPrecision(6));
          const l = parseFloat(Number(dp.low || 0).toPrecision(6));
          const c = parseFloat(Number(dp.close || 0).toPrecision(6));

          dp.open = o;
          dp.close = c;
          dp.high = Math.max(o, c, h, l); 
          dp.low = Math.min(o, c, l, h); 

          if (dp.low === 0 && dp.high === 0 && o === 0 && c === 0){ 
             const baseEntry = pick.entryPriceRange?.low || 0.000001;
             dp.open = baseEntry * (1 + (Math.random() - 0.5) * 0.1);
             dp.close = dp.open * (1 + (Math.random() - 0.5) * 0.1);
             dp.high = Math.max(dp.open, dp.close) * (1 + Math.random() * 0.05);
             dp.low = Math.min(dp.open, dp.close) * (1 - Math.random() * 0.05);
             // Ensure high is always >= low after generation
             if (dp.high < dp.low) dp.high = dp.low;
          } else {
             // Ensure high >= low, open, close and low <= high, open, close
             dp.high = Math.max(o, c, h);
             dp.low = Math.min(o, c, l);
             if (dp.high < dp.low) { // if after all this, high is still less than low (e.g. bad initial h, l)
                const temp = dp.high;
                dp.high = dp.low;
                dp.low = temp;
             }
             // Ensure open and close are within high/low
             dp.open = Math.max(dp.low, Math.min(dp.high, o));
             dp.close = Math.max(dp.low, Math.min(dp.high, c));
          }
        });
      }
    });
     if (!output.overallDisclaimer) {
        output.overallDisclaimer = "Meme coins are EXTREMELY RISKY and highly speculative. Prices are driven by hype and can collapse to zero without warning. Invest only what you are absolutely prepared to lose. This is not financial advice. DYOR!";
    }
    return output;
  }
);

    