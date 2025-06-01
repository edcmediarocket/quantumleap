
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
import { getCoinPriceTool } from '@/ai/tools/get-coin-price-tool'; // Import the new tool

const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool_code', 'tool_response']), // Added tool roles
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
11. **Fetching Coin Prices:** If {{{userName}}} asks for the current price of a cryptocurrency (e.g., "What's the price of Bitcoin?", "Current ETH price?"), you MUST use the 'getCoinPrice' tool to fetch this information. The tool accepts common coin names or ticker symbols (e.g., "Bitcoin", "BTC", "Ethereum", "ETH").
    *   When you receive the price from the tool, state it clearly, for example: "The current price of Bitcoin (BTC) is $X,XXX.XX USD." or "I found that Ethereum (ETH) is currently trading at $Y,YYY.YY USD."
    *   If the tool returns an error (e.g., coin not found, API issue), inform {{{userName}}} gracefully, for example: "I couldn't fetch the price for [Coin Name] at the moment. It might be an unsupported coin or there could be a temporary issue with the price service." or "Sorry, I wasn't able to find a price for [Coin Name]. Could you try a different name or symbol?"
    *   Do not attempt to guess or provide outdated prices. Only provide prices obtained directly from the tool.

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

    // Pre-process chatHistory into a formatted string for the prompt context
    let formattedChatHistoryString = "";
    if (chatHistory.length > 0) {
      formattedChatHistoryString = chatHistory
        .map(msg => {
          // For tool messages, we might want a more structured representation or just skip them in this simple string.
          // For now, just prefixing them.
          if (msg.role === 'user') return `USER: ${msg.content}`;
          if (msg.role === 'model') return `MODEL: ${msg.content}`;
          if (msg.role === 'tool_code') return `TOOL_CALL: ${msg.content}`; // Representing tool call details
          if (msg.role === 'tool_response') return `TOOL_RESPONSE: ${msg.content}`; // Representing tool response
          return `${msg.role.toUpperCase()}: ${msg.content}`; // Fallback for any other roles
        })
        .join('\n');
    }
    
    // Construct the Handlebars prompt string
    // Note: The system prompt already instructs about userName.
    // The Handlebars template for the prompt itself will combine system, history, and new message.
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
    
    const promptInstance = ai.definePrompt({
        name: 'aiCoachChatDynamicPrompt',
        input: { schema: DynamicPromptInputDataSchema }, // Uses the specific schema for handlebars data
        prompt: handlebarsPrompt,
        tools: [getCoinPriceTool], // Make the tool available to the prompt
        // No output schema here for this specific dynamic prompt as we're expecting a raw string back
        // Model config can be added here if needed (e.g., temperature)
    });

    // Prepare data for the prompt instance
    const promptData = {
        userMessage,
        userName,
        formattedChatHistoryString: formattedChatHistoryString || undefined,
    };
    
    const generationResponse = await promptInstance(promptData);
    
    const aiTextResponse = generationResponse.text || "I'm sorry, I couldn't generate a response at this moment. Please try again.";
    
    return { aiResponse: aiTextResponse };
  }
);
