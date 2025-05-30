
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
  quickTip: z.string().describe('A short, engaging, and helpful tip from the AI coach. Max 150 chars.'),
  suggestedActionTheme: z.enum(['INFO', 'CAUTION', 'ACTION', 'ENGAGE'])
    .describe('A general theme for the tip (e.g., INFO for general advice, CAUTION for risky contexts like meme coins, ACTION for encouraging exploration, ENGAGE for a friendly welcome/check-in).'),
});
export type GetCoachQuickTipOutput = z.infer<typeof GetCoachQuickTipOutputSchema>;

export async function getCoachQuickTip(input: GetCoachQuickTipInput): Promise<GetCoachQuickTipOutput> {
  return getCoachQuickTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getCoachQuickTipPrompt',
  input: {schema: GetCoachQuickTipInputSchema},
  output: {schema: GetCoachQuickTipOutputSchema},
  prompt: `You are Quantum, an engaging, slightly witty, and highly skilled AI Trading Coach. Your goal is to provide a quick, helpful, and context-aware tip to the user, {{{userName}}}.

Current user context: User is interacting with the '{{{userActionContext}}}' section.
{{#if lastPicksSummary}}Last picks summary: {{{lastPicksSummary}}}{{/if}}

Based on this context, provide:
1.  **quickTip**: A concise, actionable, and encouraging tip. Keep it under 150 characters.
    *   If 'memeFlip', emphasize excitement and extreme caution. Use emojis like 🚀, 🎲, 🔥, ⚠️.
    *   If 'aiPicks' or 'profitGoal', sound knowledgeable and encouraging. Use emojis like 📈, 🎯, 💡.
    *   If 'general', provide a welcoming or general trading wisdom nugget.
    *   Make it feel like a quick interjection from a helpful coach.
2.  **suggestedActionTheme**: Classify the tip's theme.
    *   'INFO': General advice or information.
    *   'CAUTION': Warning or advice for risky situations (especially for 'memeFlip').
    *   'ACTION': Encouraging the user to use features or explore.
    *   'ENGAGE': Friendly, welcoming, or motivational.

Example for 'memeFlip' context:
quickTip: "Meme market's sizzling, {{{userName}}}! 🔥 Remember, high rewards mean high risks. DYOR and trade smart! ⚠️"
suggestedActionTheme: CAUTION

Example for 'aiPicks' context:
quickTip: "Great to see you exploring AI Picks, {{{userName}}}! Let's find those gems. 💎 Remember to check the rationales!"
suggestedActionTheme: ACTION

Example for 'general' context at app start:
quickTip: "Welcome to Quantum Leap, {{{userName}}}! Ready to find some quick profit opportunities? 🚀"
suggestedActionTheme: ENGAGE

Respond strictly in the GetCoachQuickTipOutputSchema format.
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
