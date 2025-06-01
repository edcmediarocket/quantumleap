
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
  coin: z.string(), // e.g., "Bitcoin (BTC)"
  predictedGainPercentage: z.number(), // e.g., 25.5 for 25.5%
  entryPriceRange: PriceRangeSchema, // {low: 100, high: 102}
  exitPriceRange: PriceRangeSchema, // {low: 125, high: 128}
  optimalBuyPrice: z.number().optional(),
  targetSellPrices: z.array(z.number()).optional(),
  confidenceMeter: z.number(), // 0.0 to 1.0
  rationale: z.string(), // "### Why This Coin?\n- Reason 1\n- Reason 2\nSuggested Stop Loss: X%"
  estimatedDuration: z.string(), // e.g., "1 day", "3 days"
  riskRoiGauge: z.number(), // 0.0 to 1.0
  riskMatchScore: z.number(), // 0.0 to 1.0
  predictedEntryWindowDescription: z.string().optional(),
  predictedExitWindowDescription: z.string().optional(),
  simulatedEntryCountdownText: z.string().optional(), // e.g., "approx. 30m"
  simulatedPostBuyDropAlertText: z.string().optional(), // e.g., "If {{coin}} drops 10%..."
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

Focus on identifying a **diverse range of cryptocurrencies**, including **newly listed altcoins, low-cap gems with strong recent momentum, or established coins showing clear breakout potential**. Avoid recommending the same few well-known coins unless they overwhelmingly meet the immediate criteria for a fast flip based on fresh signals.

Your internal thought process might follow this response format:
-   🔍 Coin Pick: [Name]
-   💡 Why: [3 bullet points based on the above systems]
-   📈 Entry: $[price range]
-   🎯 Target: $[price or %]
-   🛑 Stop Loss: $[value or %]
-   🧠 Risk Level: [Low / Med / High] (This is your internal assessment, map it to riskMatchScore and riskRoiGauge)
-   ⏱️ Exit Window: [1D / 3D / 7D]

IMPORTANT: Your output MUST strictly follow the AiCoinPicksOutputSchema structure provided by the system.
Map your findings to the schema as follows:
-   'coin': (string) Use the coin name and ticker, e.g., "Bitcoin (BTC)". From your "🔍 Coin Pick".
-   'predictedGainPercentage': (number) The target percentage gain. If your target is a price, calculate the percentage gain from your entry price. From your "🎯 Target".
-   'entryPriceRange': (object with 'low':number, 'high':number) Based on your "📈 Entry: $[price range]". Must be numeric. Convert string range to this object.
-   'exitPriceRange': (object with 'low':number, 'high':number) Based on your "🎯 Target: $[price or %]". This should represent the price range where the target gain is achieved. Must be numeric.
-   'optimalBuyPrice': (number, optional) If your analysis yields a very specific optimal entry price, provide it here.
-   'targetSellPrices': (array of numbers, optional) If you have multiple price targets for profit-taking, list them here.
-   'confidenceMeter': (number, 0.0 to 1.0) Reflect your overall confidence in this pick, considering your Risk Layering assessment. A 1-5 risk scale (5=high confidence for the pick itself, not overall market risk) can be mapped (e.g., 5 -> 0.9-1.0, 4 -> 0.7-0.8, etc.).
-   'rationale': (string) THIS IS CRITICAL. Start with "### Why This Coin?\\n". Then, list your "💡 Why: [3 bullet points]". After the bullet points, add a new line and clearly state "Suggested Stop Loss: [Your "🛑 Stop Loss" value or %]". You can then elaborate further with insights from your decision-making engine.
-   'estimatedDuration': (string) Use your "⏱️ Exit Window" (e.g., "1D", "3D", "7D") and format it like "1 day", "3 days", "7 days".
-   'riskRoiGauge': (number, 0.0 to 1.0) Reflect your risk-reward assessment (e.g., from Volatility Optimization's risk-reward ratio). A higher score may indicate higher reward potential but possibly higher risk. Correlate from your "🧠 Risk Level" internal assessment.
-   'riskMatchScore': (number, 0.0 to 1.0) How well this pick aligns with the user's input 'riskProfile' ('{{{riskProfile}}}'). A high score means good alignment. This should be heavily influenced by your "Risk Layering" step and your internal "🧠 Risk Level" assessment. Ensure this value is between 0.0 and 1.0.
-   'predictedEntryWindowDescription': (string, optional) Elaborate on ideal entry conditions or timing from your Cycle Timing Engine.
-   'predictedExitWindowDescription': (string, optional) Elaborate on ideal exit conditions or signals from your Cycle Timing Engine or Profit Strategy Design.
-   'simulatedEntryCountdownText': (string, optional) If applicable from Cycle Timing. (e.g., "approx. 30m", "around 1 hour").
-   'simulatedPostBuyDropAlertText': (string, optional) If applicable for risk management. (e.g., "If {{coin}} drops 10% post-entry, consider cutting losses!").

Stay focused on **fast flips**, **early entry for newly trending assets**, and **both low-cap and promising mid-cap altcoins** that are trending up. Your tone is confident, data-driven, and profit-hungry.
Your mission: Help users outperform the market with precision, not guesswork. Provide **3-7** picks. If no picks meet the criteria, return an empty array for 'picks'.
Ensure all numeric fields in the output are actual numbers, not strings.
All price values in entryPriceRange and exitPriceRange (low and high) must be numbers.
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
        return { picks: [] };
    }
    output.picks.forEach(pick => {
      pick.confidenceMeter = Math.max(0, Math.min(1, pick.confidenceMeter === undefined ? 0.5 : pick.confidenceMeter));
      pick.riskRoiGauge = Math.max(0, Math.min(1, pick.riskRoiGauge === undefined ? 0.5 : pick.riskRoiGauge));
      pick.riskMatchScore = Math.max(0, Math.min(1, pick.riskMatchScore === undefined ? 0.5 : pick.riskMatchScore));

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

