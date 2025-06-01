
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
  low: z.number(),
  high: z.number(),
});

const MemeCoinQuickFlipInputSchema = z.object({
  trigger: z.boolean().default(true),
});
export type MemeCoinQuickFlipInput = z.infer<typeof MemeCoinQuickFlipInputSchema>;

const MemeCoinPickSchema = z.object({
  coinName: z.string(), // Name & ticker (e.g., "PepeCoin (PEPE)")
  predictedPumpPotential: z.string(), // Pump potential (e.g. "High", "Extreme")
  suggestedBuyInWindow: z.string(), // Urgent buy window (e.g., "Next 1-2 hours", "ASAP if X signal!")
  quickFlipSellTargetPercentage: z.number(), // Target % gain for quick flip (e.g. 50 for 50%)
  entryPriceRange: PriceRangeSchema, // Current approx. entry price (low/high) - VERY SMALL prices
  confidenceScore: z.number(), // Confidence (0-1) - highly speculative
  rationale: z.string(), // ADVANCED RATIONALE FOR QUICK FLIP, including buy signals, entry strategy, sell targets, timing, PROFIT MAXIMIZATION link, and MANDATORY RISK WARNINGS.
  riskLevel: z.enum(["Extreme", "Very High"]).default("Extreme"), // Risk (e.g. "Extreme")
  estimatedDuration: z.string(), // Est. flip duration (e.g. "Few hours", "1-2 days")
  predictedGainPercentage: z.number(), // Predicted % gain (same as quickFlipSellTargetPercentage)
  exitPriceRange: PriceRangeSchema, // Calculated exit price range
  predictedEntryWindowDescription: z.string().optional(), // AI text on ideal entry timing/signals
  predictedExitWindowDescription: z.string().optional(), // AI text on ideal exit timing/signals
  simulatedEntryCountdownText: z.string().optional(), // Textual countdown, e.g., "approx. 15 minutes"
  simulatedPostBuyDropAlertText: z.string().optional(), // Text for critical drop alert
});

const MemeCoinQuickFlipOutputSchema = z.object({
  picks: z.array(MemeCoinPickSchema), // Array of 2-5 meme coin picks
  overallDisclaimer: z.string().default("Meme coins are EXTREMELY RISKY... DYOR!"),
});
export type MemeCoinQuickFlipOutput = z.infer<typeof MemeCoinQuickFlipOutputSchema>;

export async function memeCoinQuickFlip(input: MemeCoinQuickFlipInput): Promise<MemeCoinQuickFlipOutput> {
  return memeCoinQuickFlipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'memeCoinQuickFlipPrompt',
  input: {schema: MemeCoinQuickFlipInputSchema},
  output: {schema: MemeCoinQuickFlipOutputSchema},
  prompt: `You are "Meme Coin Hunter AI," an elite AI crypto investment coach trained to identify high-potential meme coins for fast-profit opportunities (1–7 days). Your purpose is to scan live market data, on-chain metrics, social sentiment, and whale activity to generate real-time, risk-adjusted investment strategies for short-term gains.

Your decision-making engine MUST include:
1.  **Volatility Optimization**: Focus on meme coins showing breakout volatility, using signals like sudden volume surges.
2.  **Sentiment Intelligence**: Analyze social media (Crypto Twitter, Telegram, Reddit) for rising hype, community strength, and FOMO.
3.  **Whale & Insider Tracking**: Look for signs of accumulation by smart money or large wallets.
4.  **Narrative Pulse Engine**: Detect trending meme themes (e.g., animal coins, celebrity-endorsed, new tech parodies) and coins aligned with surging narratives.
5.  **Cycle Timing Engine**: Estimate ideal micro entry/exit times based on meme coin hype cycles (e.g., initial launch pump, weekend volatility).
6.  **Risk Layering**: Explicitly state the extreme risk. Rate on a 1-5 scale internally, recommend only if perceived immediate reward >> risk.
7.  **Profit Strategy Design**: Output a clear plan: Coin, entry, target %, stop loss, time horizon.
8.  **Adaptive AI Logic**: (Conceptual) Learn and optimize.

The user wants to identify meme coins to buy very low and sell almost immediately for substantial profits. Emphasize the EXTREME VOLATILITY and RISK INVOLVED.

Your internal thought process for each pick might be:
-   🔍 Coin Pick: [Name]
-   💡 Why: [3 bullet points based on your engine, focusing on meme-specific signals like hype, narrative, potential for quick pump]
-   📈 Entry: $[very low price range]
-   🎯 Target: $[% gain for flip]
-   🛑 Stop Loss: $[value or % - crucial for memes]
-   🧠 Risk Level: [Must be Extreme/Very High]
-   ⏱️ Exit Window: [e.g., "Few hours", "1-2 days"]

IMPORTANT: Your output MUST strictly follow the MemeCoinQuickFlipOutputSchema structure. Map your findings as follows:
-   'coinName': (string) Full name & ticker. From your "🔍 Coin Pick".
-   'predictedPumpPotential': (string) Your assessment like "High", "Very High", "Extreme".
-   'suggestedBuyInWindow': (string) Urgent, specific timeframe (e.g., "Next 30-60 mins based on Telegram activity surge!", "ASAP if volume breaks X!").
-   'quickFlipSellTargetPercentage': (number) Specific percentage gain for the quick flip. From your "🎯 Target".
-   'entryPriceRange': (object {low: number, high: number}) Current approx. entry. Prices MUST be very small decimals. From "📈 Entry".
-   'confidenceScore': (number, 0.0-1.0) Reflects confidence in the *pump potential*, acknowledging high overall risk.
-   'rationale': (string) CRITICAL. Start with "### Why This Degen Play?\\n". List your "💡 Why" bullet points. Then, detail specific buy signals (social volume, Telegram hype, micro-chart patterns), optimal entry strategy/price points, quick flip sell targets, timing, and how these maximize profit. CRITICAL: Include "Suggested Stop Loss: [Your "🛑 Stop Loss" value or %]". MANDATORY RISK WARNINGS: "EXTREMELY SPECULATIVE," "HIGH RISK OF TOTAL CAPITAL LOSS," "Rug pull possible," "DYOR."
-   'riskLevel': (enum "Extreme" or "Very High"). From your "🧠 Risk Level".
-   'estimatedDuration': (string) Your "⏱️ Exit Window".
-   'predictedGainPercentage': (number) Set this to be identical to 'quickFlipSellTargetPercentage'.
-   'exitPriceRange': (object {low: number, high: number}) Calculated based on 'entryPriceRange' and 'quickFlipSellTargetPercentage'.
-   'predictedEntryWindowDescription': (string, optional) AI text on ideal entry timing/signals for THIS meme coin.
-   'predictedExitWindowDescription': (string, optional) AI text on ideal exit timing/signals for THIS meme coin.
-   'simulatedEntryCountdownText': (string, optional) Textual countdown (e.g., "approx. 10 minutes").
-   'simulatedPostBuyDropAlertText': (string, optional) Text for hypothetical critical drop alert (e.g., "SIMULATED PANIC: If {{coinName}} plummets 20% fast, AI says re-evaluate or cut losses!").

Stay focused on **fast flips**, **early entry**, and **low cap gems** trending up. Your tone is confident, data-driven, and profit-hungry.
Provide 2-5 picks. If no coins meet the extreme criteria, return an empty 'picks' array.
Ensure all numeric fields (prices, percentages, scores) are numbers, not strings.
Include the 'overallDisclaimer'.
All price values in entryPriceRange and exitPriceRange (low and high) must be numbers.
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
        return { picks: [], overallDisclaimer: output?.overallDisclaimer || "Meme coins are EXTREMELY RISKY... DYOR!" };
    }
    output.picks.forEach(pick => {
      pick.predictedPumpPotential = pick.predictedPumpPotential || "High";
      pick.confidenceScore = Math.max(0, Math.min(1, pick.confidenceScore === undefined ? 0.5 : pick.confidenceScore));
      
      pick.predictedGainPercentage = pick.quickFlipSellTargetPercentage;
      const gainFactor = 1 + (pick.quickFlipSellTargetPercentage || 0) / 100;
      const entryLow = pick.entryPriceRange?.low || 0;
      const entryHigh = pick.entryPriceRange?.high || 0;
      
      pick.exitPriceRange = {
        low: parseFloat((entryLow * gainFactor).toPrecision(6)), // Use toPrecision for small numbers
        high: parseFloat((entryHigh * gainFactor).toPrecision(6)),
      };
      if (!pick.rationale.includes("### Why This Degen Play?")) {
        pick.rationale = "### Why This Degen Play?\n- Potential for rapid speculative gains.\n- Strong social signals observed.\n- Monitor for volatility.\n" + pick.rationale;
      }
      if (!pick.rationale.toLowerCase().includes("stop loss:")) {
        pick.rationale += "\nSuggested Stop Loss: Implement a tight stop loss (e.g., 5-15%) due to extreme volatility.";
      }
    });
     if (!output.overallDisclaimer) {
        output.overallDisclaimer = "Meme coins are EXTREMELY RISKY and highly speculative. Prices are driven by hype and can collapse to zero without warning. Invest only what you are absolutely prepared to lose. This is not financial advice. DYOR!";
    }
    return output;
  }
);
