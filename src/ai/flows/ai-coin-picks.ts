
// 'use server';
/**
 * @fileOverview AI coin picks flow that recommends the top 3-5 coins predicted to yield quick profits based on real-time data analytics and user risk profile.
 *
 * - aiCoinPicks - A function that handles the AI coin picks process.
 * - AiCoinPicksInput - The input type for the aiCoinPicks function.
 * - AiCoinPicksOutput - The return type for the aiCoinPicks function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PriceRangeSchema = z.object({
  low: z.number(),
  high: z.number(),
});

const AiCoinPicksInputSchema = z.object({
  profitTarget: z
    .number(),
  strategy: z.enum(['short-term', 'swing', 'scalp']).default('short-term'),
  riskProfile: z.enum(['cautious', 'balanced', 'aggressive']).default('balanced'),
});
export type AiCoinPicksInput = z.infer<typeof AiCoinPicksInputSchema>;

const AiCoinPickSchema = z.object({
  coin: z.string(),
  predictedGainPercentage: z.number(),
  entryPriceRange: PriceRangeSchema,
  exitPriceRange: PriceRangeSchema,
  optimalBuyPrice: z.number().optional(),
  targetSellPrices: z.array(z.number()).optional(),
  confidenceMeter: z.number(), 
  rationale: z.string(),
  estimatedDuration: z.string(),
  riskRoiGauge: z.number(),
  riskMatchScore: z.number(),
  predictedEntryWindowDescription: z.string().optional(),
  predictedExitWindowDescription: z.string().optional(),
  simulatedEntryCountdownText: z.string().optional(),
  simulatedPostBuyDropAlertText: z.string().optional(),
});

const AiCoinPicksOutputSchema = z.object({
  picks: z.array(AiCoinPickSchema),
});

export type AiCoinPicksOutput = z.infer<typeof AiCoinPicksOutputSchema>;

export async function aiCoinPicks(input: AiCoinPicksInput): Promise<AiCoinPicksOutput> {
  return aiCoinPicksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCoinPicksPrompt',
  input: {schema: AiCoinPicksInputSchema},
  output: {schema: AiCoinPicksOutputSchema},
  prompt: `You are an elite AI crypto investment coach trained to identify high-potential meme and altcoins for fast-profit opportunities (1–7 days). Your purpose is to scan live market data, on-chain metrics, social sentiment, and whale activity to generate real-time, risk-adjusted investment strategies for short-term gains.

Your decision-making engine should include:

1.  **Volatility Optimization** — Recommend coins that show breakout volatility with risk-reward ratios above 2.0, using Bollinger Band squeezes, sudden volume surges, and RSI trends.
2.  **Sentiment Intelligence** — Analyze social media (Crypto Twitter, Telegram, Reddit) and sentiment APIs to detect rising hype, community strength, and FOMO signals.
3.  **Whale & Insider Tracking** — Monitor wallets with over $100k+ transactions using Whale Alert APIs or on-chain data. Prioritize coins being accumulated by smart money.
4.  **Narrative Pulse Engine** — Detect trending themes (e.g., dog coins, politics, AI tokens) and recommend coins aligned with surging narratives for viral upside.
5.  **Cycle Timing Engine** — Estimate ideal entry/exit times based on fractal analysis, momentum waves, and meme coin seasonal behaviors (weekends, airdrop hype windows).
6.  **Risk Layering** — Rate each coin on a 1–5 scale for risk (liquidity, slippage, tokenomics, recent rug history) and only recommend when reward > risk. The user's input 'riskProfile' ({{{riskProfile}}}) should heavily influence this.
7.  **Profit Strategy Design** — Output a clear plan: Coin to buy, allocation size (%, risk-adjusted), entry price range, target price, stop loss, and time horizon.
8.  **Adaptive AI Logic** — Learn from past wins/losses, optimize strategies in real-time. If a prediction misses, adjust logic for future cases.

User Inputs to Consider:
-   Profit Target: {{{profitTarget}}} USD (Use as context if helpful, but your primary focus is on fast flips as described.)
-   Strategy Preference: {{{strategy}}} (Your core logic already focuses on short-term/fast flips. Align if possible.)
-   User Risk Profile: {{{riskProfile}}} (Crucial for your Risk Layering and overall recommendation suitability.)

Response format guidance for the AI (internal thought process, map this to AiCoinPicksOutputSchema below):
-   🔍 Coin Pick: [Name]
-   💡 Why: [3 bullet points based on the above systems]
-   📈 Entry: $[price range]
-   🎯 Target: $[price or %]
  (Note: Price ranges for entry and exit should be objects with 'low' and 'high' numeric values. E.g., entryPriceRange: {low: 100, high: 102})
-   🛑 Stop Loss: $[value or %]
-   🧠 Risk Level: [Correlate to user's '{{{riskProfile}}}' and your 1-5 scale. Map this general risk assessment to the 'riskMatchScore' and 'riskRoiGauge' fields, which are numbers from 0.0 to 1.0.]
-   ⏱️ Exit Window: [1D / 3D / 7D]

IMPORTANT: Your output MUST strictly follow the AiCoinPicksOutputSchema structure provided by the system.
Map your findings to the schema as follows:
-   'coin': (string) Use the coin name and ticker, e.g., "Bitcoin (BTC)".
-   'predictedGainPercentage': (number) The target percentage gain from your "Target" field. If your target is a price, calculate the percentage gain from your entry price.
-   'entryPriceRange': (object with 'low':number, 'high':number) Based on your "Entry: $[price range]". If it's a single price, set low and high to be very close or equal. Must be numeric.
-   'exitPriceRange': (object with 'low':number, 'high':number) Based on your "Target: $[price or %]". This should represent the price range where the target gain is achieved. Must be numeric.
-   'optimalBuyPrice': (number, optional) If your analysis yields a very specific optimal entry price, provide it here.
-   'targetSellPrices': (array of numbers, optional) If you have multiple price targets for profit-taking, list them here.
-   'confidenceMeter': (number, 0.0 to 1.0) Reflect your overall confidence in this pick, considering your Risk Layering assessment. A 1-5 risk scale (5=best) can be mapped (e.g., 5 -> 0.9-1.0, 4 -> 0.7-0.8, etc.).
-   'rationale': (string) THIS IS CRITICAL. Start with "### Why This Coin?\\n". Then, list your 3 bullet points. After the bullet points, add a new line and clearly state "Suggested Stop Loss: [Your stop loss value or %]". Then, you can elaborate further on insights from Volatility Optimization, Sentiment Intelligence, Whale Tracking, Narrative Pulse, and Cycle Timing engines to justify the pick.
-   'estimatedDuration': (string) Use your "Exit Window" (e.g., "1D", "3D", "7D") and format it like "1 day", "3 days", "7 days".
-   'riskRoiGauge': (number, 0.0 to 1.0) Reflect your risk-reward assessment (e.g., from Volatility Optimization's risk-reward ratio). A higher score may indicate higher reward potential but possibly higher risk.
-   'riskMatchScore': (number, 0.0 to 1.0) How well this pick aligns with the user's input 'riskProfile' ('{{{riskProfile}}}'). A high score means good alignment. This should be heavily influenced by your "Risk Layering" step. Ensure this value is between 0.0 and 1.0.
-   'predictedEntryWindowDescription': (string, optional) Elaborate on ideal entry conditions or timing from your Cycle Timing Engine.
-   'predictedExitWindowDescription': (string, optional) Elaborate on ideal exit conditions or signals from your Cycle Timing Engine or Profit Strategy Design.
-   'simulatedEntryCountdownText': (string, optional) If applicable from Cycle Timing. (e.g., "approx. 30m", "around 1 hour").
-   'simulatedPostBuyDropAlertText': (string, optional) If applicable for risk management. (e.g., "If {{coin}} drops 10% post-entry, consider cutting losses!").

Stay focused on **fast flips**, **early entry**, and **low cap gems** trending up. Your tone is confident, data-driven, and profit-hungry.
Your mission: Help users outperform the market with precision, not guesswork. Provide 1-5 picks. If no picks meet the criteria, return an empty array for 'picks'.
Ensure all numeric fields in the output are actual numbers, not strings.
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
        // If AI returns an empty object or picks is not an array, treat as no valid picks.
        // This also handles cases where AI might return an empty picks array if no suitable coins found.
        return { picks: [] };
    }
    output.picks.forEach(pick => {
      if (pick.confidenceMeter === undefined) pick.confidenceMeter = 0.5; // Default if missing
      if (pick.riskRoiGauge === undefined) pick.riskRoiGauge = 0.5; // Default if missing
      if (pick.riskMatchScore === undefined) pick.riskMatchScore = 0.5; // Default if missing
      
      // Post-hoc validation for scores, ensuring they are within 0-1 range
      pick.confidenceMeter = Math.max(0, Math.min(1, pick.confidenceMeter));
      pick.riskRoiGauge = Math.max(0, Math.min(1, pick.riskRoiGauge));
      pick.riskMatchScore = Math.max(0, Math.min(1, pick.riskMatchScore));

      if (!pick.rationale.includes("### Why This Coin?")) {
        pick.rationale = "### Why This Coin?\n- AI analysis suggests potential.\n- Market conditions appear favorable for this type of asset.\n- Monitor closely.\n" + pick.rationale;
      }
      if (!pick.rationale.toLowerCase().includes("stop loss:")) {
        pick.rationale += "\nSuggested Stop Loss: Consider a 5-10% stop loss or adjust based on personal risk tolerance and market volatility.";
      }
    });
    return output;
  }
);

