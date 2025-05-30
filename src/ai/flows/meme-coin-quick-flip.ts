
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
  time: z.string().describe("Date (YYYY-MM-DD)"), // Extremely concise
  open: z.number().describe("Open price"),
  high: z.number().describe("High price"),
  low: z.number().describe("Low price"),
  close: z.number().describe("Close price"),
});


const MemeCoinQuickFlipInputSchema = z.object({
  trigger: z.boolean().default(true).describe('Trigger for meme coin scan.'),
});
export type MemeCoinQuickFlipInput = z.infer<typeof MemeCoinQuickFlipInputSchema>;

const MemeCoinQuickFlipOutputSchema = z.object({
  picks: z.array(
    z.object({
      coinName: z.string().describe('Name & ticker'),
      predictedPumpPotential: z.string().describe('Pump potential (e.g. "High", "Extreme")'), 
      suggestedBuyInWindow: z.string().describe('Urgent buy window (e.g., "Next 1-2 hours")'), 
      quickFlipSellTargetPercentage: z.number().describe('Target % gain for quick flip (e.g. 50 for 50%)'), 
      entryPriceRange: PriceRangeSchema.describe('Current approx. entry price (low/high)'),
      confidenceScore: z.number().describe('Confidence (0-1) - speculative'),
      rationale: z.string().describe('Advanced rationale for quick flip: specific buy signals (social volume, Telegram hype, unusual whale-like activity for memes, micro-chart patterns like brief consolidations before next leg up), optimal entry price points/windows (e.g., "target entry near X if brief dip occurs", "consider initial buy on X volume spike"), ideal quick flip sell targets/strategy (e.g., "aim for Y% then re-evaluate", "sell 50% at Z% then trail rest"), timing considerations for maximizing profit (e.g. "monitor during peak US/Asia trading hours if social hype aligns"). Must detail WHY this pick, BEST TIME/PRICE to buy for quick profit, and link directly to PROFIT MAXIMIZATION. CRITICAL: Include STRONG warnings like "EXTREMELY SPECULATIVE," "HIGH RISK OF TOTAL CAPITAL LOSS," "Rug pull possible," "DYOR." Detailed, actionable, advanced, profit-focused.'),
      riskLevel: z.enum(["Extreme", "Very High"]).default("Extreme").describe('Risk (e.g. "Extreme")'),
      mockCandlestickData: z.array(CandlestickDataPointSchema).length(10).describe("10 mock daily OHLC data points, recent May 2025. Volatile, very low prices, YYYY-MM-DD format."),
      estimatedDuration: z.string().describe('Est. flip duration (e.g. "Few hours", "1-2 days")'),
      predictedGainPercentage: z.number().describe('Predicted % gain (same as quickFlipSellTargetPercentage)'),
      exitPriceRange: PriceRangeSchema.describe('Calculated exit price range based on target gain'),
    })
  ).describe('Array of 2-4 meme coin quick flip picks.'),
  overallDisclaimer: z.string().default("Meme coins are EXTREMELY RISKY and highly speculative. Prices are driven by hype and can collapse to zero without warning. Invest only what you are absolutely prepared to lose. This is not financial advice. DYOR!").describe("Overall risk disclaimer for meme coins.")
});
export type MemeCoinQuickFlipOutput = z.infer<typeof MemeCoinQuickFlipOutputSchema>;

export async function memeCoinQuickFlip(input: MemeCoinQuickFlipInput): Promise<MemeCoinQuickFlipOutput> {
  return memeCoinQuickFlipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'memeCoinQuickFlipPrompt',
  input: {schema: MemeCoinQuickFlipInputSchema},
  output: {schema: MemeCoinQuickFlipOutputSchema},
  prompt: `You are "Meme Coin Hunter AI," an expert AI specializing in identifying EXTREMELY HIGH-RISK, POTENTIALLY HIGH-REWARD meme coins primed for a quick price explosion and flip. Your focus is on ADVANCED, ACTIONABLE insights for users aiming to maximize profit in highly speculative trades.

The user wants to identify meme coins to buy very low and sell almost immediately for substantial profits. Emphasize the EXTREME VOLATILITY and RISK INVOLVED.

For each potential meme coin (recommend 2-4), provide the following details STRICTLY adhering to the MemeCoinQuickFlipOutputSchema:

1.  **Coin Name (coinName)**: Full name and ticker (e.g., PepeCoin (PEPE)). Matches 'Name & ticker'.
2.  **Predicted Pump Potential (predictedPumpPotential)**: Qualitative assessment (e.g., "High", "Very High", "Extreme"). REQUIRED. Matches 'Pump potential'.
3.  **Suggested Buy-In Window (suggestedBuyInWindow)**: Urgent, specific timeframe (e.g., "Next 1-2 hours - monitor for X signal", "ASAP if Y conditions met!"). Matches 'Urgent buy window'.
4.  **Quick Flip Sell Target Percentage (quickFlipSellTargetPercentage)**: Specific percentage gain target for a quick exit (e.g., 75 for 75% gain). This value will also be used for 'predictedGainPercentage'. Matches 'Target % gain'.
5.  **Entry Price Range (entryPriceRange)**: Object with 'low' and 'high' numeric values for current approximate entry. Prices should be VERY SMALL (e.g., {low: 0.00000012, high: 0.00000015}). Matches 'Current approx. entry price'.
6.  **Confidence Score (confidenceScore)**: 0.0 to 1.0, reflecting high uncertainty despite potential. REQUIRED. Matches 'Confidence (0-1) - speculative'.
7.  **Rationale (rationale)**: This is CRITICAL. Provide an ADVANCED, DETAILED, and ACTIONABLE rationale (2-3 substantial paragraphs) geared towards PROFIT MAXIMIZATION for a quick flip. Include:
    *   **Specific Buy Signals**: What specific, observable (even if speculative) signals suggest an imminent pump? (e.g., sudden surge in social media mentions on X platform by Y type of accounts, rapid increase in Telegram group members, unusual on-chain volume for a new meme coin, specific micro-chart patterns like a brief consolidation above a new support after an initial micro-pump).
    *   **Optimal Entry Strategy**: What's the best approach to get in? (e.g., "Target entry near \${X_PRICE} if a brief dip occurs post-announcement", "Consider an initial position on a confirmed volume spike above Y, then add if Z pattern forms", "Look for liquidity pool additions as a potential precursor").
    *   **Quick Flip Sell Strategy & Targets**: How to maximize profit on the way out? (e.g., "Aim for the {{{quickFlipSellTargetPercentage}}}% target primarily. Consider selling 50% at Z% if achieved quickly, then trail a stop-loss on the remainder", "Set limit sell orders slightly below psychological resistance levels once in profit").
    *   **Timing Considerations**: Any specific timing elements? (e.g., "Monitor closely during peak US/Asia trading hours if social hype from those regions is a driver", "Volatility expected around X event time").
    *   **Profit Maximization Link**: Clearly explain how these factors combine to create a high-probability (though still high-risk) quick flip profit opportunity.
    *   **MANDATORY RISK WARNINGS**: Integrate phrases like "This is an EXTREMELY SPECULATIVE degen play," "There is a VERY HIGH RISK OF TOTAL CAPITAL LOSS," "The possibility of a rug pull or scam is significant," "Invest only funds you are absolutely prepared to lose entirely," "Thoroughly Do Your Own Research (DYOR) and verify contract addresses before any interaction." These warnings must be prominent and clear.
    Matches 'Advanced rationale for quick flip...'.
8.  **Risk Level (riskLevel)**: Must be "Extreme" or "Very High". REQUIRED. Matches 'Risk (e.g. "Extreme")'.
9.  **Mock Candlestick Data (mockCandlestickData)**: Generate exactly 10 mock daily candlestick data points (time, open, high, low, close) for the last 10 days leading up to a plausible RECENT date in May 2025 (e.g., May 10-May 20, 2025). Data must show EXTREME volatility and very low prices typical of meme coins. Time as 'YYYY-MM-DD'. Matches '10 mock daily OHLC data points, recent May 2025...'.
10. **Estimated Duration (estimatedDuration)**: Speculative timeframe for the flip (e.g., "Few hours to 2 days"). Matches 'Est. flip duration'.

Based on the 'Entry Price Range' and 'Quick Flip Sell Target Percentage', calculate and provide an 'Exit Price Range' (exitPriceRange) (low and high).
Set 'predictedGainPercentage' to be identical to 'quickFlipSellTargetPercentage'.

Output format MUST strictly follow MemeCoinQuickFlipOutputSchema.
Ensure all numeric values are numbers. Dates in mock data MUST be in May 2025 or an appropriate preceding period if necessary (e.g. late April to early May).
Mock candlestick data fields are time (string 'YYYY-MM-DD'), open (number), high (number), low (number), close (number).
Provide an 'overallDisclaimer' as defined in the schema.
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
        pick.predictedPumpPotential = "High"; // Default if missing
        console.warn(`Predicted pump potential for ${pick.coinName} was missing. Defaulted to "High".`);
      }
      
      pick.predictedGainPercentage = pick.quickFlipSellTargetPercentage;
      const gainFactor = 1 + pick.quickFlipSellTargetPercentage / 100;
      pick.exitPriceRange = {
        low: parseFloat((pick.entryPriceRange.low * gainFactor).toPrecision(6)),
        high: parseFloat((pick.entryPriceRange.high * gainFactor).toPrecision(6)),
      };
      
      if (!pick.mockCandlestickData || pick.mockCandlestickData.length !== 10) { 
        console.warn(`Mock candlestick data for ${pick.coinName} was invalid or missing. Generating default 10 points for May 2025.`);
        const endDate = new Date(2025, 4, 20); // Target May 20, 2025 (month is 0-indexed)
        pick.mockCandlestickData = Array(10).fill(null).map((_, i) => { 
          const date = new Date(endDate);
          date.setDate(endDate.getDate() - (9 - i)); // Generate 10 days leading up to endDate
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
               // Attempt to keep month/day but ensure year is 2025
               let month = parseInt(parts[1]);
               let day = parseInt(parts[2]);
               // If month is outside 1-12 or day is outside 1-31, use a fallback for May 2025.
               if (month < 1 || month > 12 || day < 1 || day > 31) {
                  const fallbackEndDate = new Date(2025, 4, 20); // May 20
                  const fallbackDate = new Date(fallbackEndDate);
                  fallbackDate.setDate(fallbackEndDate.getDate() - (pick.mockCandlestickData.indexOf(dp) % 10));
                  dp.time = fallbackDate.toISOString().split('T')[0];
               } else {
                 dp.time = `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
               }
            } else { // If original format is bad, generate a sequence in May
               const fallbackEndDate = new Date(2025, 4, 20); 
               const fallbackDate = new Date(fallbackEndDate);
               fallbackDate.setDate(fallbackEndDate.getDate() - (pick.mockCandlestickData.indexOf(dp) % 10) );
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
          
          // Basic validation for OHLC
          const maxOC = Math.max(o, c);
          const minOC = Math.min(o, c);

          dp.high = Math.max(maxOC, h); // High must be at least open or close
          dp.low = Math.min(minOC, l);   // Low must be at most open or close

          if (dp.high < dp.low) { // If high is still less than low (e.g. bad initial h, l), swap or adjust
             const temp = dp.high;
             dp.high = dp.low;
             dp.low = temp;
             if (dp.high === dp.low && dp.high === 0) { // If both zero, generate small positive variation
                dp.high = basePrice * 0.000001 * (1 + Math.random() * 0.1);
                dp.low = basePrice * 0.000001;
             }
          }
           // Ensure open and close are within high/low
          dp.open = Math.max(dp.low, Math.min(dp.high, o));
          dp.close = Math.max(dp.low, Math.min(dp.high, c));
        });
      }
    });
     if (!output.overallDisclaimer) {
        output.overallDisclaimer = "Meme coins are EXTREMELY RISKY and highly speculative. Prices are driven by hype and can collapse to zero without warning. Invest only what you are absolutely prepared to lose. This is not financial advice. DYOR!";
    }
    return output;
  }
);
