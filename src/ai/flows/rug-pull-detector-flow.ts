'use server';
/**
 * @fileOverview An AI agent to assess the risk of a cryptocurrency being a "rug pull".
 *
 * - detectRugPull - A function that analyzes a coin for rug pull risk.
 * - RugPullDetectorInput - The input type for the detectRugPull function.
 * - RugPullDetectorOutput - The return type for the detectRugPull function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const RugPullDetectorInputSchema = z.object({
  coinName: z.string().describe('The name of the cryptocurrency (e.g., "SuperSafeMoon").'),
  coinSymbol: z.string().optional().describe('The ticker symbol of the cryptocurrency (e.g., "SSM").'),
  description: z.string().optional().describe('A brief description of the coin, its purpose, or recent news.'),
  websiteUrl: z.string().url().optional().describe('The official website URL of the project.'),
  socialMediaLinks: z.array(z.string().url()).optional().describe('An array of URLs to the project\'s social media pages (e.g., Twitter, Telegram, Discord).'),
  contractAddress: z.string().optional().describe('The smart contract address of the token, if known.'),
  // Add other relevant fields as they become available or necessary, e.g., exchange listings, liquidity info source.
});
export type RugPullDetectorInput = z.infer<typeof RugPullDetectorInputSchema>;

export const RugPullDetectorOutputSchema = z.object({
  riskLevel: z.enum(["Low", "Medium", "High", "Very High", "Extreme"]).describe('The AI-assessed risk level of the coin being a rug pull.'),
  confidenceScore: z.number().min(0).max(1).describe('The AI\'s confidence in its risk assessment (0.0 to 1.0).'),
  summary: z.string().describe('A brief overall assessment of the rug pull risk.'),
  positiveSigns: z.array(z.string()).describe('A list of observed factors that may decrease rug pull risk.'),
  redFlags: z.array(z.string()).describe('A list of observed factors that may increase rug pull risk.'),
  detailedRationale: z.string().describe('A detailed explanation of how the AI reached its conclusion, discussing the provided information and common rug pull indicators.'),
  disclaimer: z.string().default('This AI-generated risk assessment is for informational purposes only and not financial advice. Cryptocurrency investments are highly speculative and subject to substantial risk. Always Do Your Own Research (DYOR).'),
});
export type RugPullDetectorOutput = z.infer<typeof RugPullDetectorOutputSchema>;

export async function detectRugPull(input: RugPullDetectorInput): Promise<RugPullDetectorOutput> {
  return rugPullDetectorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'rugPullDetectorPrompt',
  input: {schema: RugPullDetectorInputSchema},
  output: {schema: RugPullDetectorOutputSchema},
  prompt: `You are an expert cryptocurrency analyst specializing in identifying potential 'rug pulls' or scam tokens, particularly within the meme coin, new altcoin, and DeFi spaces. Your primary goal is to analyze the provided information about a cryptocurrency and assess its risk of being a rug pull.

You must provide a comprehensive analysis covering various aspects. Consider the following factors based on the input given ({{{coinName}}}, {{#if coinSymbol}}Symbol: {{{coinSymbol}}}, {{/if}}{{#if description}}Description: {{{description}}}, {{/if}}{{#if websiteUrl}}Website: {{{websiteUrl}}}, {{/if}}{{#if socialMediaLinks}}Socials: {{#each socialMediaLinks}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}, {{/if}}{{#if contractAddress}}Contract: {{{contractAddress}}}{{/if}}):

1.  **Team & Transparency**:
    *   Is the team anonymous or public? Are their identities verifiable?
    *   Do they have a credible track record or prior experience in blockchain/crypto?
    *   How professional is their communication?

2.  **Tokenomics & Supply Distribution**:
    *   Is there information on token supply distribution? Are large portions held by a few wallets (especially team/dev wallets)?
    *   Is liquidity locked? If so, for how long and with what mechanism (e.g., Unicrypt, Pinksale)? (If this info isn't directly provided, note its absence as a potential risk if typical for this type of coin).
    *   Are there unusually high transaction taxes or mechanisms that benefit only the team?

3.  **Website & Whitepaper Quality**:
    *   Does the project have a professional website and a well-written whitepaper?
    *   Are there clear goals, a viable use case, and a realistic roadmap?
    *   Look for signs of plagiarism, vagueness, or overly ambitious/unrealistic claims.

4.  **Social Media Presence & Community**:
    *   Is there genuine community engagement, or does it appear to be bot-driven or overly reliant on hype?
    *   Are social media channels active, with reasonable discussion and moderation?
    *   Are there signs of overly aggressive marketing or unrealistic promises of returns?
    *   Are critical questions being censored or ignored in community channels?

5.  **Security & Audits**:
    *   Has the smart contract been audited by a reputable firm? (If not, this is often a red flag, especially for DeFi projects or tokens with complex mechanics).
    *   If an audit exists, what were the findings? Were critical issues addressed?
    *   (If contract address is provided and you had tools to analyze it, you would look for malicious functions, but state if you cannot do this).

6.  **Market Activity & Listings (if inferable or known for similar coins)**:
    *   Is the coin listed on reputable exchanges, or only obscure DEXs?
    *   Is there evidence of suspicious trading activity like extreme, unexplained pumps followed by dumps?
    *   Is liquidity very low, making it easy for a few sellers to crash the price?

7.  **General Red Flags**:
    *   Promises of guaranteed high returns with little to no risk.
    *   Pressure to buy quickly (FOMO inducement).
    *   Lack of a clear utility or use case beyond speculation.
    *   Copycat project with minimal innovation.
    *   Anonymous developers with no clear communication channels beyond initial launch.

Based on your analysis of these factors from the provided input, formulate your response strictly accordingto the RugPullDetectorOutputSchema.
-   Determine 'riskLevel' (Low, Medium, High, Very High, Extreme).
-   Set a 'confidenceScore' for your assessment.
-   Provide a concise 'summary'.
-   List specific 'positiveSigns' (if any).
-   List specific 'redFlags' (be detailed here).
-   Write a 'detailedRationale' explaining your findings and how you arrived at the risk level. Explicitly state if critical information (like liquidity lock status or audit details) is missing and how that impacts the assessment.
-   Include the default 'disclaimer'.

Be objective and thorough. Your goal is to help users make more informed decisions by highlighting potential risks.
If critical information is missing, state that it limits your analysis for certain aspects but still provide an assessment based on available data and common patterns for such coins.
For example, if website is not provided for a new coin, that itself is a red flag.
If only a coin name is provided, base your analysis on common characteristics of coins with similar names or typical new coin launches, but clearly state the limitations.
`,
});

const rugPullDetectorFlow = ai.defineFlow(
  {
    name: 'rugPullDetectorFlow',
    inputSchema: RugPullDetectorInputSchema,
    outputSchema: RugPullDetectorOutputSchema,
  },
  async (input: RugPullDetectorInput) => {
    // Pre-validation or enrichment of input can happen here if needed.
    // For example, if socialMediaLinks is a string, convert it to an array.
    // Or, if no description is provided, you might add a default placeholder.

    const {output} = await prompt(input);

    if (!output) {
      // Fallback in case AI fails to produce structured output
      return {
        riskLevel: "Indeterminate" as any, // Should not happen with Zod but as a fallback
        confidenceScore: 0,
        summary: "AI analysis failed to produce a result. Critical information might be missing or an internal error occurred.",
        positiveSigns: [],
        redFlags: ["AI analysis was inconclusive."],
        detailedRationale: "The AI could not provide a detailed rationale due to an error or lack of sufficient information to process the request as expected.",
        disclaimer: RugPullDetectorOutputSchema.shape.disclaimer.default("This AI-generated risk assessment is for informational purposes only and not financial advice. Cryptocurrency investments are highly speculative and subject to substantial risk. Always Do Your Own Research (DYOR)."),
      };
    }
    
    // Ensure disclaimer is always present, even if AI somehow omits it.
    if (!output.disclaimer) {
      output.disclaimer = RugPullDetectorOutputSchema.shape.disclaimer.default("This AI-generated risk assessment is for informational purposes only and not financial advice. Cryptocurrency investments are highly speculative and subject to substantial risk. Always Do Your Own Research (DYOR).");
    }
    
    return output;
  }
);
