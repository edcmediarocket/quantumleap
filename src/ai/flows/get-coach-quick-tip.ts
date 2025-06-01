
'use server';
/**
 * @fileOverview Provides quick, engaging tips from an AI Trading Coach based on user context.
 *
 * - getCoachQuickTip - A function that generates a contextual quick tip.
 * - GetCoachQuickTipInput - The input type for the getCoachQuickTip function.
 * - GetCoachQuickTipOutput - The return type for the getCoachQuickTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetCoachQuickTipInputSchema = z.object({
  userActionContext: z.enum(['aiPicks', 'profitGoal', 'memeFlip', 'general'])
    .describe('The current section or action the user is focused on.'),
  lastPicksSummary: z.string().optional()
    .describe("Optional: A very brief summary of the last coin picks shown, e.g., 'BTC, ETH bullish', 'PEPE extreme pump'. Max 50 chars."),
  userName: z.string().optional().default('Trader').describe('Optional user name for personalization.'),
});
export type GetCoachQuickTipInput = z.infer<typeof GetCoachQuickTipInputSchema>;

const GetCoachQuickTipOutputSchema = z.object({
  quickTip: z.string().describe('A short, engaging, insightful, and helpful tip from the AI coach. Max 150 chars.'),
  suggestedActionTheme: z.enum(['INFO', 'CAUTION', 'ACTION', 'ENGAGE', 'STRATEGY'])
    .describe('A general theme for the tip (e.g., INFO for general advice, CAUTION for risky contexts, ACTION for encouraging exploration, ENGAGE for welcome, STRATEGY for a tactical hint).'),
});
export type GetCoachQuickTipOutput = z.infer<typeof GetCoachQuickTipOutputSchema>;

export async function getCoachQuickTip(input: GetCoachQuickTipInput): Promise<GetCoachQuickTipOutput> {
  return getCoachQuickTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getCoachQuickTipPrompt',
  input: {schema: GetCoachQuickTipInputSchema},
  output: {schema: GetCoachQuickTipOutputSchema},
  prompt: `You are Quantum, a sophisticated, insightful, and highly skilled AI Trading Coach. Your goal is to provide a quick, thought-provoking, and context-aware micro-insight or strategic reminder to the user, {{{userName}}}.

Current user context: User is interacting with the '{{{userActionContext}}}' section.
{{#if lastPicksSummary}}Last picks summary: {{{lastPicksSummary}}}{{/if}}

Based on this context, provide:
1.  **quickTip**: A concise, advanced-sounding, and actionable tip reflecting deep market understanding. Keep it under 150 characters.
    *   If 'memeFlip', emphasize excitement, extreme caution, and rapid decision-making. Use emojis like 🚀, 🎲, 🔥, ⚠️, ⚡.
        *   Example (CAUTION): "Meme market's wild, {{{userName}}}! ⚡ Speed & conviction are key, but manage that risk! 🎲"
        *   Example (STRATEGY): "Meme momentum can shift in seconds, {{{userName}}}! Secure profits quickly & don't chase waterfalls. 🌊"
    *   If 'aiPicks' or 'profitGoal', sound knowledgeable, strategic, and encouraging. Use emojis like 📈, 🎯, 💡, 🧠.
        *   Example (STRATEGY for aiPicks): "AI Picks are in, {{{userName}}}! Align these with your macro view for max impact. 🧠"
        *   Example (STRATEGY for profitGoal): "Profit goal set, {{{userName}}}! Remember, discipline in execution turns targets into reality. 🎯"
        *   Example (ACTION for aiPicks): "When evaluating picks, {{{userName}}}, consider the Risk/ROI gauge. Is it aligned with your current strategy? 🤔"
    *   If 'general', provide a welcoming or a nugget of advanced trading wisdom.
        *   Example (ENGAGE): "Welcome, {{{userName}}}! Ready to dissect the market's latest moves? 🧐"
        *   Example (STRATEGY): "Mastering risk isn't just defense, {{{userName}}}; it's the foundation of aggressive offense. 🛡️"
        *   Example (INFO): "The best traders adapt, {{{userName}}}. Is your strategy flexible enough for today's market? 💡"
    *   Make it feel like a quick interjection from a helpful, expert coach.
2.  **suggestedActionTheme**: Classify the tip's theme.
    *   'INFO': General market/trading information or observation.
    *   'CAUTION': Warning or advice for risky situations (especially for 'memeFlip').
    *   'ACTION': Encouraging the user to use features, explore, or consider a move.
    *   'ENGAGE': Friendly, welcoming, or motivational.
    *   'STRATEGY': A tactical hint or strategic consideration (like planning, risk management ideas, execution discipline).

Example for 'memeFlip' context with STRATEGY theme:
quickTip: "Meme heat is on, {{{userName}}}! 🔥 Analyze sentiment spikes & on-chain data for those quick flips. Trade smart! ⚠️"
suggestedActionTheme: STRATEGY

Example for 'aiPicks' context with STRATEGY theme:
quickTip: "Exploring AI Picks, {{{userName}}}? Cross-reference with key support/resistance levels for stronger entries. 💡"
suggestedActionTheme: STRATEGY

Example for 'general' context at app start with ENGAGE theme:
quickTip: "Welcome back, {{{userName}}}! The market never sleeps. What opportunities are we hunting today? 🚀"
suggestedActionTheme: ENGAGE

Respond strictly in the GetCoachQuickTipOutputSchema format. Ensure tips are insightful and provide genuine value.
Select the most appropriate 'suggestedActionTheme' based on the tip's content.
`,
});

const getCoachQuickTipFlow = ai.defineFlow(
  {
    name: 'getCoachQuickTipFlow',
    inputSchema: GetCoachQuickTipInputSchema,
    outputSchema: GetCoachQuickTipOutputSchema,
  },
  async (input: GetCoachQuickTipInput) => {
    // Ensure lastPicksSummary is not too long for the prompt
    if (input.lastPicksSummary && input.lastPicksSummary.length > 50) {
      input.lastPicksSummary = input.lastPicksSummary.substring(0, 47) + "...";
    }
    const {output} = await prompt(input);
    if (!output) {
      return {
        quickTip: "Welcome to Quantum Leap! Let's find some amazing opportunities today!",
        suggestedActionTheme: 'ENGAGE',
      } as GetCoachQuickTipOutput;
    }
    return output;
  }
);

