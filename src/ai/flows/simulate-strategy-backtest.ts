
'use server';
/**
 * @fileOverview Simulates the backtested performance of a given crypto strategy.
 *
 * - simulateStrategyBacktest - A function that runs the simulation.
 * - SimulateStrategyBacktestInput - Input for the simulation.
 * - SimulateStrategyBacktestOutput - Output of the simulation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvestmentStrategySchemaForSim = z.object({
  name: z.string().describe('The name of the investment strategy.'),
  optimalBuyPrice: z.number().optional().describe('The suggested optimal buy price.'),
  targetSellPrices: z.array(z.number()).min(1).describe('Target sell prices.'),
  stopLossSuggestion: z.string().optional().describe('The stop-loss suggestion.'),
  // We don't need the full strategy, just key elements for simulation
});

const SimulateStrategyBacktestInputSchema = z.object({
  coinName: z.string().describe('The name or ticker symbol of the cryptocurrency.'),
  backtestPeriod: z.enum(['7d', '30d', '90d']).describe('The period to simulate over (e.g., past 7 days).'),
  strategyToSimulate: InvestmentStrategySchemaForSim.describe('The specific investment strategy details to simulate.'),
});
export type SimulateStrategyBacktestInput = z.infer<typeof SimulateStrategyBacktestInputSchema>;

const SimulateStrategyBacktestOutputSchema = z.object({
  simulationTitle: z.string().describe('A title for the simulation, e.g., "Simulated 7-Day Backtest for [Coin] - Strategy: [Strategy Name]".'),
  performanceOutcome: z.enum(['Profitable', 'Loss-making', 'Breakeven', 'Indeterminate']).describe('The overall simulated outcome of the strategy.'),
  simulatedProfitLossPercentage: z.number().optional().describe('The estimated profit or loss percentage from the simulation. Can be omitted if outcome is indeterminate.'),
  simulationNarrative: z.string().describe('A detailed narrative describing a plausible historical price movement for the coin over the period and how the given strategy (entry, targets, stop-loss) would have hypothetically performed against this imagined scenario. Mention key inflection points. IMPORTANT: Any prices or monetary values mentioned in this narrative MUST be written as full decimal numbers (e.g., 0.000000075 or $0.15) and NOT in scientific notation (e.g., 7.5e-8 or 1.5e-1). Prefix with a dollar sign if applicable (e.g., $0.000000075).'),
  keyEvents: z.array(z.string()).optional().describe('A list of key simulated events, e.g., "Entry triggered near simulated day X at $0.0000000Y", "First target hit on simulated day Z at $0.00000011". IMPORTANT: Any prices or monetary values mentioned in these events MUST be written as full decimal numbers and NOT in scientific notation. Prefix with a dollar sign if applicable.'),
  importantDisclaimer: z.string().default('IMPORTANT: This is a SIMULATED backtest. Price movements are generated by AI based on typical coin behavior and do NOT represent actual historical market data. Results are hypothetical and for educational purposes only. They are not a guarantee of future performance.').describe('A mandatory disclaimer about the nature of the simulation.'),
});
export type SimulateStrategyBacktestOutput = z.infer<typeof SimulateStrategyBacktestOutputSchema>;

export async function simulateStrategyBacktest(input: SimulateStrategyBacktestInput): Promise<SimulateStrategyBacktestOutput> {
  return simulateStrategyBacktestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simulateStrategyBacktestPrompt',
  input: {schema: SimulateStrategyBacktestInputSchema},
  output: {schema: SimulateStrategyBacktestOutputSchema},
  prompt: `You are a Crypto Strategy Backtesting Simulator. Your task is to generate a PLAUSIBLE, HYPOTHETICAL historical scenario for a given cryptocurrency and then simulate how a specific trading strategy would have performed. YOU DO NOT HAVE ACCESS TO REAL HISTORICAL DATA.

Coin for Simulation: {{{coinName}}}
Backtest Period (simulated past): {{{backtestPeriod}}}
Strategy to Simulate:
  Name: {{{strategyToSimulate.name}}}
  Optimal Buy Price: \${{{strategyToSimulate.optimalBuyPrice}}}
  Target Sell Prices: \${{{strategyToSimulate.targetSellPrices}}}
  Stop-Loss Suggestion: {{{strategyToSimulate.stopLossSuggestion}}}

Instructions:
1.  **Generate Simulation Title**: Create a title like "Simulated {{{backtestPeriod}}} Backtest for {{{coinName}}} - Strategy: {{{strategyToSimulate.name}}}".
2.  **Imagine Plausible Price Action**: Based on the general volatility and typical market behavior expected for a coin like {{{coinName}}}, describe a plausible, illustrative day-by-day or key-event-based price action summary for the specified 'past' {{{backtestPeriod}}}. This is a creative generation, not factual data. Mention potential ups, downs, and consolidations that are characteristic for such a coin.
    *   IMPORTANT: Any prices or monetary values mentioned in this narrative (simulationNarrative field) MUST be written as full decimal numbers (e.g., 0.000000075 or $0.15) and NOT in scientific notation (e.g., 7.5e-8 or 1.5e-1). Prefix with a dollar sign if applicable (e.g., $0.000000075).
3.  **Simulate Strategy Performance**:
    *   Narrate how the provided strategy (entry at optimal buy price, aiming for target sell prices, considering the stop-loss) would have hypothetically performed against YOUR IMAGINED price action.
    *   Would the entry point have been hit?
    *   Would any of the target sell prices have been reached? In what order?
    *   Would the stop-loss (as described) likely have been triggered?
    *   This narrative should be detailed and explain the simulated trade journey.
    *   Ensure all price mentions adhere to the full decimal number format specified above.
4.  **Determine Performance Outcome**: Based on your simulation, classify the strategy's performance as 'Profitable', 'Loss-making', 'Breakeven', or 'Indeterminate'.
5.  **Estimate Profit/Loss Percentage (Optional)**: If the outcome is 'Profitable' or 'Loss-making', provide an estimated percentage. If 'Breakeven' or 'Indeterminate', this can be omitted or set to 0.
6.  **List Key Simulated Events (Optional)**: Bullet point key moments in your simulation (e.g., "Entry at $0.000000XX on simulated day Y", "Target 1 hit at $0.00000YY").
    *   IMPORTANT: Any prices or monetary values mentioned in these keyEvents MUST be written as full decimal numbers and NOT in scientific notation. Prefix with a dollar sign if applicable.
7.  **Provide Important Disclaimer**: Ensure the output includes the mandatory disclaimer about this being a simulation.

Focus on creating a coherent and illustrative story of how the strategy might have played out in a *typical* (but still generated and hypothetical) market scenario for that coin. Be explicit that this is not real data.

Output strictly in the SimulateStrategyBacktestOutputSchema format.
`,
});

const simulateStrategyBacktestFlow = ai.defineFlow(
  {
    name: 'simulateStrategyBacktestFlow',
    inputSchema: SimulateStrategyBacktestInputSchema,
    outputSchema: SimulateStrategyBacktestOutputSchema,
  },
  async (input: SimulateStrategyBacktestInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate simulation results.');
    }
    // Ensure disclaimer is always present
    if (!output.importantDisclaimer) {
      output.importantDisclaimer = 'IMPORTANT: This is a SIMULATED backtest. Price movements are generated by AI based on typical coin behavior and do NOT represent actual historical market data. Results are hypothetical and for educational purposes only. They are not a guarantee of future performance.';
    }
    return output;
  }
);

    

