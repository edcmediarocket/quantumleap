
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

const CandlestickDataPointSchema = z.object({
  time: z.string().describe("Date YYYY-MM-DD"),
  open: z.number().describe('Open price'),
  high: z.number().describe('High price'),
  low: z.number().describe('Low price'),
  close: z.number().describe('Close price'),
});

// Input might be simple, as meme coin hunting is often less about user parameters
// and more about the AI's "scan" of the market.
const MemeCoinQuickFlipInputSchema = z.object({
  trigger: z.boolean().default(true).describe('Trigger for meme coin scan.'),
  // Optional: Could add a general risk appetite confirmation later if needed
  // riskConfirmation: z.boolean().refine(val => val === true, { message: "User must confirm understanding of extreme risk."}),
});
export type MemeCoinQuickFlipInput = z.infer<typeof MemeCoinQuickFlipInputSchema>;

const MemeCoinQuickFlipOutputSchema = z.object({
  picks: z.array(
    z.object({
      coinName: z.string().describe('Name & ticker'),
      predictedPumpPotential: z.string().describe('Pump potential'),
      suggestedBuyInWindow: z.string().describe('Buy window'),
      quickFlipSellTargetPercentage: z.number().describe('Target % gain'),
      entryPriceRange: PriceRangeSchema.describe('Entry price range'),
      confidenceScore: z.number().min(0).max(1).describe('Confidence (0-1)'),
      rationale: z.string().describe('Rationale & risk. 2-3 paras. Incl: "Highly speculative," "Extreme risk," "Rug pull," "DYOR."'),
      riskLevel: z.enum(["Extreme", "Very High"]).default("Extreme").describe('Risk level'),
      mockCandlestickData: z.array(CandlestickDataPointSchema).length(30).describe("30 mock daily OHLC, 2025. Volatile, low prices."),
      estimatedDuration: z.string().describe('Est. duration (speculative)'),
      predictedGainPercentage: z.number().describe('Predicted % gain'),
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
1.  **Coin Name**: Full name and ticker if possible (e.g., PepeCoin (PEPE), TurboToad (TOAD)). Ensure this matches 'Name & ticker' schema.
2.  **Predicted Pump Potential**: (e.g., "High", "Very High", "Extreme"). THIS IS A REQUIRED FIELD. Ensure this matches 'Pump potential' schema.
3.  **Suggested Buy-In Window**: (e.g., "Next 1-4 hours - monitor closely!", "ASAP - extreme vigilance needed!"). Ensure this matches 'Buy window' schema.
4.  **Quick Flip Sell Target Percentage**: A specific percentage gain target for a quick exit (e.g., 50 for 50% gain, 200 for 200% gain). This will be used for 'predictedGainPercentage'. Ensure this matches 'Target % gain' schema.
5.  **Entry Price Range**: An object with 'low' and 'high' numeric values for the current approximate entry price. These prices should be VERY SMALL (e.g., {low: 0.00000012, high: 0.00000015}). Ensure this matches 'Entry price range' schema.
6.  **Confidence Score**: 0.0 to 1.0 (reflecting high uncertainty despite potential). THIS IS A REQUIRED FIELD. Ensure this matches 'Confidence (0-1)' schema.
7.  **Rationale (CRITICAL EMPHASIS ON RISK)**: 2-3 paragraphs.
    *   Focus on: social media hype (Twitter, Telegram, Reddit), influencer mentions, new/imminent CEX/DEX listings, extremely low market cap, tokenomics (supply, burn), strong narrative, high community engagement, recent volume spikes.
    *   MANDATORY: Include strong warnings like "This is a degen play," "EXTREMELY SPECULATIVE," "HIGH RISK OF TOTAL CAPITAL LOSS," "Possibility of rug pull or scam is significant," "Only invest funds you can afford to lose entirely," "Thoroughly Do Your Own Research (DYOR) before considering." Ensure this matches 'Rationale & risk. 2-3 paras. Incl: "Highly speculative," "Extreme risk," "Rug pull," "DYOR."' schema.
8.  **Risk Level**: Must be "Extreme" or "Very High". THIS IS A REQUIRED FIELD. Ensure this matches 'Risk level' schema.
9.  **Mock Candlestick Data**: Generate 30 mock daily candlestick data points for the last 30 days leading up to a plausible RECENT date in 2025. Each data point object MUST contain 'time' (YYYY-MM-DD), 'open', 'high', 'low', and 'close' numeric values. Data must show EXTREME volatility and very low prices typical of meme coins (e.g., values like 0.000000XX). Ensure this matches '30 mock daily OHLC, 2025. Volatile, low prices.' schema for the array and individual points ('Date YYYY-MM-DD', 'Open price', 'High price', 'Low price', 'Close price').
10. **Estimated Duration**: Speculative timeframe for the flip (e.g., "Few hours to 2 days"). Ensure this matches 'Est. duration (speculative)' schema.

Based on the 'Entry Price Range' and 'Quick Flip Sell Target Percentage', calculate and provide an 'Exit Price Range' (low and high). For example, if entry is {low: 0.1, high: 0.11} and target is 50%, exit would be {low: 0.15, high: 0.165}. Ensure this matches 'Exit price range (calc.)' schema.
Also, set 'predictedGainPercentage' to be the same as 'Quick Flip Sell Target Percentage'. Ensure this matches 'Predicted % gain' schema.

Output format MUST strictly follow MemeCoinQuickFlipOutputSchema.
Provide an 'overallDisclaimer' as defined in the schema ('Overall risk disclaimer.').
Ensure all numeric values are numbers. Dates in mock data MUST be in 2025.
Mock candlestick data must be plausible for highly volatile, very low-priced meme coins.
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
      // Fallback for missing predictedPumpPotential
      if (!pick.predictedPumpPotential) {
        pick.predictedPumpPotential = "High"; // Default value
        console.warn(`Predicted pump potential for ${pick.coinName} was missing. Defaulted to "High".`);
      }
      
      // Calculate exitPriceRange and ensure predictedGainPercentage is set
      pick.predictedGainPercentage = pick.quickFlipSellTargetPercentage;
      const gainFactor = 1 + pick.quickFlipSellTargetPercentage / 100;
      pick.exitPriceRange = {
        low: parseFloat((pick.entryPriceRange.low * gainFactor).toPrecision(6)),
        high: parseFloat((pick.entryPriceRange.high * gainFactor).toPrecision(6)),
      };
      
      if (!pick.mockCandlestickData || pick.mockCandlestickData.length !== 30) {
        console.warn(`Mock candlestick data for ${pick.coinName} was invalid or missing. Generating default for 2025.`);
        pick.mockCandlestickData = Array(30).fill(null).map((_, i) => {
          const date = new Date(2025, 0, 15); // Use a fixed recent date in 2025 as base for mock
          date.setDate(date.getDate() + i - 29);
          const basePrice = pick.entryPriceRange && typeof pick.entryPriceRange.low === 'number' ? pick.entryPriceRange.low : 0.000001;
          const open = basePrice * (1 + (Math.random() - 0.5) * 0.8); // Higher volatility
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
               fallbackDate.setDate(fallbackDate.getDate() + (pick.mockCandlestickData?.indexOf(dp) ?? 0) - 29); // Try to keep sequence
               dp.time = fallbackDate.toISOString().split('T')[0];
            }
          }
          // Ensure prices are very small for meme coins in AI provided data too
          // And ensure all OHLC values exist and are numbers
          dp.open = parseFloat(Number(dp.open || 0).toPrecision(6));
          dp.high = parseFloat(Number(dp.high || 0).toPrecision(6));
          dp.low = parseFloat(Number(dp.low || 0).toPrecision(6));
          dp.close = parseFloat(Number(dp.close || 0).toPrecision(6));
           // Ensure high is highest and low is lowest
          const o = dp.open;
          const c = dp.close;
          dp.high = Math.max(o, c, dp.high);
          dp.low = Math.min(o, c, dp.low);
          if (dp.low === 0 && dp.high === 0 && o === 0 && c === 0){ // if all are zero, try to make it a bit realistic based on entry
             const baseEntry = pick.entryPriceRange?.low || 0.000001;
             dp.open = baseEntry * (1 + (Math.random() - 0.5) * 0.1);
             dp.close = dp.open * (1 + (Math.random() - 0.5) * 0.1);
             dp.high = Math.max(dp.open, dp.close) * (1 + Math.random() * 0.05);
             dp.low = Math.min(dp.open, dp.close) * (1 - Math.random() * 0.05);
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

