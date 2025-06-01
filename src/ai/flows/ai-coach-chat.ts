
'use server';
/**
 * @fileOverview A conversational AI trading coach.
 *
 * - aiCoachChat - A function that handles conversational AI responses.
 * - AiCoachChatInput - The input type for the aiCoachChat function.
 * - AiCoachChatOutput - The return type for the aiCoachChat function.
 */

import {ai} from '@/ai/genkit';
import {generate} from 'genkit/generate';
import {z} from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

const AiCoachChatInputSchema = z.object({
  userMessage: z.string().describe('The latest message from the user.'),
  chatHistory: z.array(MessageSchema).optional().describe('The history of the conversation so far.'),
  userName: z.string().optional().default('Trader').describe('Optional user name for personalization.'),
});
export type AiCoachChatInput = z.infer<typeof AiCoachChatInputSchema>;

const AiCoachChatOutputSchema = z.object({
  aiResponse: z.string().describe("The AI coach's response to the user."),
});
export type AiCoachChatOutput = z.infer<typeof AiCoachChatOutputSchema>;

export async function aiCoachChat(input: AiCoachChatInput): Promise<AiCoachChatOutput> {
  return aiCoachChatFlow(input);
}

const systemPrompt = `You are Quantum, an exceptionally advanced and insightful AI Trading Coach. You possess deep knowledge of cryptocurrency markets, trading strategies (from scalping to long-term investing), technical analysis (chart patterns, indicators like RSI, MACD, Bollinger Bands, Fibonacci retracements), fundamental analysis (project viability, tokenomics, whitepapers, team assessment), risk management (position sizing, stop-loss orders, portfolio diversification), market psychology (FOMO, FUD, market cycles), and emerging crypto trends (DeFi, NFTs, Layer 2 solutions, meme coins).

Your primary role is to be an educator and a guide, particularly for users new to cryptocurrency trading, but you can also engage with experienced traders on complex topics. Your goal is to help users understand the intricacies of crypto trading, make informed decisions, and develop strategies to maximize their profit potential responsibly.

Key Instructions:
1.  **Be Patient and Clear:** Explain complex concepts in a simple, digestible manner, especially for beginners. Use analogies if helpful.
2.  **Comprehensive Answers:** Provide detailed and thorough responses. If a question is broad, break it down.
3.  **Actionable Tips (Educational):** Offer actionable advice on how to learn, how to analyze, or what to consider (e.g., "When evaluating a new coin, look for these red flags in its whitepaper..." or "A common mistake beginners make is...").
4.  **No Direct Financial Advice:** You MUST NOT give direct financial advice. Do not tell users to buy or sell specific cryptocurrencies at specific times. Instead, teach them HOW to make those decisions themselves (e.g., "Instead of asking if X coin is a good buy, let's explore how you could analyze X coin's potential.").
5.  **Risk Emphasis:** Always emphasize the risks involved in cryptocurrency trading. Remind users about volatility and the importance of DYOR (Do Your Own Research).
6.  **Encourage Learning:** Motivate users to learn continuously and to think critically.
7.  **Stay on Topic:** If asked about non-trading topics, politely steer the conversation back to crypto education.
8.  **Use Markdown:** Utilize markdown for formatting (bold, italics, lists, code blocks for examples if applicable) to make your responses easy to read and structured.
9.  **Personalization:** Address the user as '{{{userName}}}' when appropriate to make the interaction more engaging.
10. **Contextual Responses:** Pay close attention to the provided CHAT HISTORY to understand the flow of conversation and provide relevant follow-up responses. Avoid repeating information unnecessarily if it's clear from the history that the user already understands it.

You are helping {{{userName}}}.
`;

// Define a Zod schema specifically for the dynamic prompt's input data.
const DynamicPromptInputDataSchema = z.object({
  userMessage: z.string(),
  userName: z.string().optional().default('Trader'),
  formattedChatHistoryString: z.string().optional(),
});

const aiCoachChatFlow = ai.defineFlow(
  {
    name: 'aiCoachChatFlow',
    inputSchema: AiCoachChatInputSchema, // Flow's external input remains the same
    outputSchema: AiCoachChatOutputSchema,
  },
  async (input) => {
    const { userMessage, chatHistory = [], userName } = input;

    // Pre-process chatHistory into a formatted string
    let formattedChatHistoryString = "";
    if (chatHistory.length > 0) {
      formattedChatHistoryString = chatHistory
        .map(msg => {
          if (msg.role === 'user') {
            return `USER: ${msg.content}`;
          } else {
            return `MODEL: ${msg.content}`;
          }
        })
        .join('\n');
    }

    // Construct the Handlebars prompt string
    const handlebarsPrompt = `
${systemPrompt}

CHAT HISTORY:
{{#if formattedChatHistoryString}}
{{{formattedChatHistoryString}}}
{{else}}
(No previous messages in this session)
{{/if}}

LATEST USER MESSAGE from {{{userName}}}:
{{{userMessage}}}

MODEL RESPONSE:
`;
    
    // Define the prompt instance using the new schema for its input
    const promptInstance = ai.definePrompt({
        name: 'aiCoachChatDynamicPrompt',
        input: { schema: DynamicPromptInputDataSchema },
        prompt: handlebarsPrompt,
        // No output schema here for this specific dynamic prompt as we're expecting a raw string back
    });

    // Prepare data for the prompt instance
    const promptData = {
        userMessage,
        userName,
        formattedChatHistoryString: formattedChatHistoryString || undefined, // Pass undefined if empty to work with {{#if}}
    };
    
    const llmResponse = await promptInstance(promptData);
    // Assuming llmResponse.output will be the text or an object with text.
    // Accessing output directly might be the string if no output schema is defined for the prompt.
    const aiTextResponse = (typeof llmResponse.output === 'string' ? llmResponse.output : llmResponse.output?.toString()) || "I'm sorry, I couldn't generate a response at this moment. Please try again.";
    
    return { aiResponse: aiTextResponse };
  }
);
