
/**
 * @fileOverview A Genkit tool to fetch the current price of a cryptocurrency.
 *
 * - getCoinPrice - The tool function.
 * - GetCoinPriceInputSchema - Input schema for the tool.
 * - GetCoinPriceOutputSchema - Output schema for the tool.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// A simple map for common cryptocurrencies to CoinGecko IDs.
// This can be expanded or replaced with a dynamic lookup from CoinGecko's /coins/list endpoint for a more robust solution.
const coinIdMap: Record<string, string> = {
  bitcoin: 'bitcoin',
  btc: 'bitcoin',
  ethereum: 'ethereum',
  eth: 'ethereum',
  solana: 'solana',
  sol: 'solana',
  dogecoin: 'dogecoin',
  doge: 'dogecoin',
  shiba: 'shiba-inu', // Common shorthand
  'shiba inu': 'shiba-inu',
  shib: 'shiba-inu',
  cardano: 'cardano',
  ada: 'cardano',
  ripple: 'ripple',
  xrp: 'ripple',
  polkadot: 'polkadot',
  dot: 'polkadot',
  litecoin: 'litecoin',
  ltc: 'litecoin',
  chainlink: 'chainlink',
  link: 'chainlink',
  binancecoin: 'binancecoin',
  bnb: 'binancecoin',
  tether: 'tether',
  usdt: 'tether',
  usdcoin: 'usd-coin',
  usdc: 'usd-coin',
  pepe: 'pepe', // Example meme coin
  wif: 'dogwifcoin', // Example meme coin "dogwifhat" often referred as WIF
  dogwifhat: 'dogwifcoin',
  bonk: 'bonk',
};

export const GetCoinPriceInputSchema = z.object({
  coinNameOrSymbol: z.string().toLowerCase().describe("The name or ticker symbol of the cryptocurrency (e.g., Bitcoin, BTC, Ethereum, ETH). The AI should try to match common names/symbols."),
});
export type GetCoinPriceInput = z.infer<typeof GetCoinPriceInputSchema>;

export const GetCoinPriceOutputSchema = z.object({
  coinId: z.string().describe("The resolved ID of the coin used for the API call, if successful."),
  price: z.number().optional().describe("The current price of the coin in USD."),
  error: z.string().optional().describe("An error message if the price could not be fetched or the coin was not found."),
});
export type GetCoinPriceOutput = z.infer<typeof GetCoinPriceOutputSchema>;

export const getCoinPriceTool = ai.defineTool(
  {
    name: 'getCoinPrice',
    description: 'Fetches the current market price of a specified cryptocurrency in USD. Accepts common coin names or ticker symbols.',
    inputSchema: GetCoinPriceInputSchema,
    outputSchema: GetCoinPriceOutputSchema,
  },
  async (input: GetCoinPriceInput): Promise<GetCoinPriceOutput> => {
    const normalizedInput = input.coinNameOrSymbol.toLowerCase().trim();
    const coinId = coinIdMap[normalizedInput];

    if (!coinId) {
      return { coinId: normalizedInput, error: `Coin '${input.coinNameOrSymbol}' not found in the supported list or symbol is ambiguous.` };
    }

    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`CoinGecko API error for ${coinId}: ${response.status} ${response.statusText}`, errorBody);
        return { coinId, error: `API error: ${response.statusText}. Could not fetch price for ${coinId}. Details: ${errorBody}` };
      }
      const data = await response.json();
      
      if (data[coinId] && typeof data[coinId].usd === 'number') {
        return { coinId, price: data[coinId].usd };
      } else {
        console.error(`Unexpected response structure from CoinGecko for ${coinId}:`, data);
        return { coinId, error: `Could not find USD price for ${coinId} in API response, or response structure was unexpected.` };
      }
    } catch (error: any) {
      console.error(`Network or other error fetching price for ${coinId}:`, error);
      return { coinId, error: `Failed to fetch price for ${coinId} due to a network or system error: ${error.message || 'Unknown error'}` };
    }
  }
);
