
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

// Input might be simple, as meme coin hunting is often less about user parameters
// and more about the AI's "scan" of the market.
const MemeCoinQuickFlipInputSchema = z.object({
  trigger: z.boolean().default(true).describe('A trigger to initiate the meme coin scan.'),
  // Optional: Could add a general risk appetite confirmation later if needed
  // riskConfirmation: z.boolean().refine(val => val === true, { message: "User must confirm understanding of extreme risk."}),
});
export type MemeCoinQuickFlipInput = z.infer<typeof MemeCoinQuickFlipInputSchema>;

const MemeCoinQuickFlipOutputSchema = z.object({
  picks: z.array(
    z.object({
      coinName: z.string().describe('The name of the meme coin, often including its ticker if available (e.g., "CrazyFrog (CFG)").'),
      predictedPumpPotential: z.string().describe('A qualitative assessment of pump potential (e.g., "High", "Very High", "Extreme").'),
      suggestedBuyInWindow: z.string().describe('A very short-term window for considering entry (e.g., "Next 1-4 hours", "ASAP - extreme vigilance required").'),
      quickFlipSellTargetPercentage: z.number().describe('A suggested percentage gain for a quick flip exit (e.g., 50 for 50% gain, 100 for 100% gain).'),
      entryPriceRange: PriceRangeSchema.describe('The approximate current or very recent entry price range (low/high), understanding this can be highly volatile.'),
      // Exit price range might be too volatile for meme coins, target percentage is more practical.
      // exitPriceRange: PriceRangeSchema.describe('The approximate target exit price range (low/high).'),
      confidenceScore: z.number().min(0).max(1).describe('A value between 0 and 1 indicating the AI\'s "confidence" in this speculative pick, acknowledging high uncertainty.'),
      rationale: z.string().describe('A detailed rationale (2-3 paragraphs) for why this meme coin might pump. Focus on meme-specific factors: social media hype (Twitter, Telegram, Reddit mentions), influencer shilling, new exchange listings, very low market cap, tokenomics (e.g., burn mechanisms, low float), narrative, community engagement, recent unusual volume spikes. CRITICALLY: This rationale MUST heavily emphasize the EXTREME risk, speculative nature, and likelihood of losing invested capital. Use phrases like "Highly speculative," "Extreme risk of capital loss," "Potential for rug pull," "DYOR thoroughly."'),
      riskLevel: z.enum(["Extreme", "Very High"]).default("Extreme").describe('Explicit risk level classification, almost always "Extreme" for meme coins.'),
      mockCandlestickData: z.array(CandlestickDataPointSchema).length(30).describe("A list of 30 mock daily candlestick data points for this coin for the last 30 days leading up to a plausible recent date in 2025. Prices should be extremely small, typical for new meme coins (e.g., many zeros after decimal). The chart should show extreme volatility."),
      estimatedDuration: z.string().describe('Estimated duration for the quick flip (e.g., "Few hours to 2 days", "Within 24 hours"). This is highly speculative.'),
      // Adding predictedGainPercentage for consistency with CoinCard, derived from quickFlipSellTargetPercentage
      predictedGainPercentage: z.number().describe('The predicted percentage gain for this coin, same as quickFlipSellTargetPercentage.'),
      // Adding exitPriceRange, calculated from entry and target percentage
      exitPriceRange: PriceRangeSchema.describe('The calculated exit price range based on entry and target percentage.'),
    })
  ).describe('An array of recommended meme coin quick flip picks.'),
  overallDisclaimer: z.string().default("Meme coins are EXTREMELY RISKY and highly speculative. Prices are driven by hype and can collapse to zero without warning. Invest only what you are absolutely prepared to lose. This is not financial advice. DYOR!").describe("An overall disclaimer about the extreme risks of meme coin trading.")
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
1.  **Coin Name**: Full name and ticker if possible (e.g., PepeCoin (PEPE), TurboToad (TOAD)).
2.  **Predicted Pump Potential**: (e.g., "High", "Very High", "Extreme").
3.  **Suggested Buy-In Window**: (e.g., "Next 1-4 hours - monitor closely!", "ASAP - extreme vigilance needed!").
4.  **Quick Flip Sell Target Percentage**: A specific percentage gain target for a quick exit (e.g., 50 for 50% gain, 200 for 200% gain). This will be used for 'predictedGainPercentage'.
5.  **Entry Price Range**: An object with 'low' and 'high' numeric values for the current approximate entry price. These prices should be VERY SMALL (e.g., {low: 0.00000012, high: 0.00000015}).
6.  **Confidence Score**: 0.0 to 1.0 (reflecting high uncertainty despite potential).
7.  **Rationale (CRITICAL EMPHASIS ON RISK)**: 2-3 paragraphs.
    *   Focus on: social media hype (Twitter, Telegram, Reddit), influencer mentions, new/imminent CEX/DEX listings, extremely low market cap, tokenomics (supply, burn), strong narrative, high community engagement, recent volume spikes.
    *   MANDATORY: Include strong warnings like "This is a degen play," "EXTREMELY SPECULATIVE," "HIGH RISK OF TOTAL CAPITAL LOSS," "Possibility of rug pull or scam is significant," "Only invest funds you can afford to lose entirely," "Thoroughly Do Your Own Research (DYOR) before considering."
8.  **Risk Level**: Must be "Extreme" or "Very High".
9.  **Mock Candlestick Data**: Generate 30 mock daily candlestick data points for the last 30 days leading up to a plausible RECENT date in 2025. Data must show EXTREME volatility and very low prices typical of meme coins (e.g., values like 0.000000XX).
10. **Estimated Duration**: Speculative timeframe for the flip (e.g., "Few hours to 2 days").

Based on the 'Entry Price Range' and 'Quick Flip Sell Target Percentage', calculate and provide an 'Exit Price Range' (low and high). For example, if entry is {low: 0.1, high: 0.11} and target is 50%, exit would be {low: 0.15, high: 0.165}.
Also, set 'predictedGainPercentage' to be the same as 'Quick Flip Sell Target Percentage'.

Output format MUST strictly follow MemeCoinQuickFlipOutputSchema.
Provide an 'overallDisclaimer' as defined in the schema.
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
          if (!dp.time.startsWith('2025')) {
            console.warn(`Correcting date for ${pick.coinName} to 2025. Original: ${dp.time}`);
            const parts = dp.time.split('-');
            if (parts.length === 3) {
               dp.time = `2025-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else {
               const fallbackDate = new Date(2025,0,1); // Should not happen if AI follows prompt
               dp.time = fallbackDate.toISOString().split('T')[0];
            }
          }
          // Ensure prices are very small for meme coins in AI provided data too
          dp.open = parseFloat(dp.open.toPrecision(6));
          dp.high = parseFloat(dp.high.toPrecision(6));
          dp.low = parseFloat(dp.low.toPrecision(6));
          dp.close = parseFloat(dp.close.toPrecision(6));
        });
      }
    });
     if (!output.overallDisclaimer) {
        output.overallDisclaimer = "Meme coins are EXTREMELY RISKY and highly speculative. Prices are driven by hype and can collapse to zero without warning. Invest only what you are absolutely prepared to lose. This is not financial advice. DYOR!";
    }
    return output;
  }
);

    

    