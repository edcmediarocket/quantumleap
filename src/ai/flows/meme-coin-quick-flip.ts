
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

const MemeCoinQuickFlipInputSchema = z.object({
  trigger: z.boolean().default(true).describe('Trigger for meme coin scan.'),
});
export type MemeCoinQuickFlipInput = z.infer<typeof MemeCoinQuickFlipInputSchema>;

const MemeCoinQuickFlipOutputSchema = z.object({
  picks: z.array(
    z.object({
      coinName: z.string().describe('Name & ticker (e.g., "PepeCoin (PEPE)")'),
      predictedPumpPotential: z.string().describe('Pump potential (e.g. "High", "Extreme")'), 
      suggestedBuyInWindow: z.string().describe('Urgent buy window (e.g., "Next 1-2 hours", "ASAP if X signal!")'), 
      quickFlipSellTargetPercentage: z.number().describe('Target % gain for quick flip (e.g. 50 for 50%)'), 
      entryPriceRange: PriceRangeSchema.describe('Current approx. entry price (low/high) - VERY SMALL prices'),
      confidenceScore: z.number().describe('Confidence (0-1) - highly speculative, default 0.5 if missing'),
      rationale: z.string().describe('ADVANCED RATIONALE FOR QUICK FLIP (2-3 PARAGRAPHS): Specific buy signals (social volume, Telegram hype, micro-chart patterns), optimal entry strategy/price points (e.g., "target entry near X if dip", "buy on Y volume spike"), quick flip sell targets/strategy (e.g., "aim for Z% then re-eval", "sell 50% at A% then trail rest"), timing considerations (e.g., "monitor during peak US/Asia hours"). CRITICAL: Detail WHY this pick, BEST TIME/PRICE TO BUY for quick profit, and link DIRECTLY TO PROFIT MAXIMIZATION. MANDATORY RISK WARNINGS: "EXTREMELY SPECULATIVE," "HIGH RISK OF TOTAL CAPITAL LOSS," "Rug pull possible," "DYOR." Detailed, actionable, advanced, profit-focused.'),
      riskLevel: z.enum(["Extreme", "Very High"]).default("Extreme").describe('Risk (e.g. "Extreme")'),
      estimatedDuration: z.string().describe('Est. flip duration (e.g. "Few hours", "1-2 days")'),
      predictedGainPercentage: z.number().describe('Predicted % gain (same as quickFlipSellTargetPercentage)'),
      exitPriceRange: PriceRangeSchema.describe('Calculated exit price range based on target gain'),
    })
  ).describe('Array of 2-5 meme coin quick flip picks.'), // Updated description
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

For each potential meme coin (recommend 2-5), provide the following details STRICTLY adhering to the MemeCoinQuickFlipOutputSchema:

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
    Matches 'ADVANCED RATIONALE FOR QUICK FLIP...'.
8.  **Risk Level (riskLevel)**: Must be "Extreme" or "Very High". REQUIRED. Matches 'Risk (e.g. "Extreme")'.
9.  **Estimated Duration (estimatedDuration)**: Speculative timeframe for the flip (e.g., "Few hours to 2 days"). Matches 'Est. flip duration'.

Based on the 'Entry Price Range' and 'Quick Flip Sell Target Percentage', calculate and provide an 'Exit Price Range' (exitPriceRange) (low and high).
Set 'predictedGainPercentage' to be identical to 'quickFlipSellTargetPercentage'.

Output format MUST strictly follow MemeCoinQuickFlipOutputSchema.
Ensure all numeric values are numbers.
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
        pick.predictedPumpPotential = "High"; 
        console.warn(`Predicted pump potential for ${pick.coinName} was missing. Defaulted to "High".`);
      }
      if (pick.confidenceScore === undefined) {
        pick.confidenceScore = 0.5;
      }
      
      pick.predictedGainPercentage = pick.quickFlipSellTargetPercentage;
      const gainFactor = 1 + pick.quickFlipSellTargetPercentage / 100;
      pick.exitPriceRange = {
        low: parseFloat((pick.entryPriceRange.low * gainFactor).toPrecision(6)),
        high: parseFloat((pick.entryPriceRange.high * gainFactor).toPrecision(6)),
      };
    });
     if (!output.overallDisclaimer) {
        output.overallDisclaimer = "Meme coins are EXTREMELY RISKY and highly speculative. Prices are driven by hype and can collapse to zero without warning. Invest only what you are absolutely prepared to lose. This is not financial advice. DYOR!";
    }
    return output;
  }
);

