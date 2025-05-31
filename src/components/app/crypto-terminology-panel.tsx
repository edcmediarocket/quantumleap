
"use client";

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  GlassCardRoot,
  GlassCardContent,
} from "./glass-card";
import { 
  BookOpenText, 
  Bitcoin, 
  Network, 
  Store, 
  Wallet, 
  Users, 
  ShieldAlert, 
  Target, 
  AreaChart, 
  Search, 
  Flame, 
  Archive, 
  Fuel, 
  Waves, 
  LayoutGrid, 
  Landmark,
  Coins,
  Blocks,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ClipboardCheck,
  Zap,
  HandHeart, // Corrected icon import
  Gauge,
  Droplets,
  Shapes,
  Banknote
} from 'lucide-react';

const terminologyList = [
  {
    id: "cryptocurrency",
    term: "Cryptocurrency",
    icon: <Coins className="h-5 w-5 mr-2 text-primary" />,
    explanation: [
      "A digital or virtual currency that is secured by cryptography, which makes it nearly impossible to counterfeit or double-spend.",
      "Many cryptocurrencies are decentralized networks based on blockchain technology—a distributed ledger enforced by a disparate network of computers. A defining feature of cryptocurrencies is that they are generally not issued by any central authority, rendering them theoretically immune to government interference or manipulation."
    ]
  },
  {
    id: "blockchain",
    term: "Blockchain",
    icon: <Blocks className="h-5 w-5 mr-2 text-primary" />,
    explanation: [
      "A decentralized, distributed, and often public digital ledger that is used to record transactions across many computers so that any involved record cannot be altered retroactively, without the alteration of all subsequent blocks.",
      "This allows participants to verify and audit transactions independently and relatively inexpensively. Each block contains a cryptographic hash of the previous block, a timestamp, and transaction data."
    ]
  },
  {
    id: "exchange",
    term: "Exchange (Crypto)",
    icon: <Store className="h-5 w-5 mr-2 text-primary" />,
    explanation: [
      "A platform where you can buy, sell, or trade cryptocurrencies for other digital currencies or traditional fiat currencies (like USD, EUR).",
      "Exchanges can be centralized (CEX), acting as intermediaries, or decentralized (DEX), allowing peer-to-peer trading without a central authority."
    ]
  },
  {
    id: "wallet",
    term: "Wallet (Crypto)",
    icon: <Wallet className="h-5 w-5 mr-2 text-primary" />,
    explanation: [
      "A digital tool that allows users to store, send, and receive cryptocurrencies. Wallets store your private keys (secret codes) that give you access to your coins.",
      "Types include software wallets (desktop, mobile, web) and hardware wallets (physical devices). 'Hot wallets' are connected to the internet, while 'cold wallets' (like hardware wallets) are offline and generally more secure."
    ]
  },
  {
    id: "whales",
    term: "Whales",
    icon: <Users className="h-5 w-5 mr-2 text-primary" />,
    explanation: [
      "Individuals or entities that hold very large amounts of a particular cryptocurrency. Because they control a significant portion of a coin's supply, their buying or selling actions can have a noticeable impact on the market price.",
      "Tracking whale activity is a common (though not foolproof) strategy for some traders trying to anticipate market movements."
    ]
  },
  {
    id: "stop-loss",
    term: "Stop-Loss Order",
    icon: <ShieldAlert className="h-5 w-5 mr-2 text-red-500" />,
    explanation: [
      "An order placed with an exchange to sell a cryptocurrency when it reaches a certain lower price. The purpose of a stop-loss order is to limit an investor's loss on a security position.",
      "For example, if you buy a coin at $10 and set a stop-loss at $9, your coins will automatically be sold if the price drops to $9, preventing further losses if the price continues to fall."
    ]
  },
  {
    id: "target-price",
    term: "Target Price (Take Profit)",
    icon: <Target className="h-5 w-5 mr-2 text-green-500" />,
    explanation: [
      "A pre-determined price at which an investor decides to sell a cryptocurrency to realize profits. It's the price at which they believe the asset is fairly valued or has reached their desired gain.",
      "Setting a take-profit order helps lock in gains and avoid emotional decision-making if the price suddenly changes."
    ]
  },
  {
    id: "market-cap",
    term: "Market Capitalization (Market Cap)",
    icon: <AreaChart className="h-5 w-5 mr-2 text-primary" />,
    explanation: [
      "The total market value of a cryptocurrency's circulating supply. It is calculated by multiplying the current market price of a single coin by the total number of coins in circulation.",
      "Market cap is often used to gauge the size and relative stability of a cryptocurrency. Large-cap coins are generally seen as less volatile than small-cap coins."
    ]
  },
  {
    id: "dyor",
    term: "DYOR (Do Your Own Research)",
    icon: <Search className="h-5 w-5 mr-2 text-accent" />,
    explanation: [
      "A very common piece of advice in the cryptocurrency space. It encourages individuals to thoroughly investigate a project, its technology, team, tokenomics, community, and potential risks before making any investment decisions, rather than solely relying on others' opinions or hype."
    ]
  },
  {
    id: "fomo",
    term: "FOMO (Fear Of Missing Out)",
    icon: <Flame className="h-5 w-5 mr-2 text-orange-500" />,
    explanation: [
      "An emotional response where investors buy a cryptocurrency, often impulsively, because its price is rapidly increasing and they fear missing out on potential profits. FOMO can lead to buying at market tops and making poor investment decisions driven by emotion rather than logic."
    ]
  },
  {
    id: "hodl",
    term: "HODL",
    icon: <HandHeart className="h-5 w-5 mr-2 text-purple-500" />, // Corrected icon usage
    explanation: [
      "A term originating from a misspelling of 'hold' in an early Bitcoin forum post. It has come to mean holding onto a cryptocurrency for the long term, regardless of short-term price volatility. It represents a belief in the long-term potential of the asset."
    ]
  },
  {
    id: "gas-fees",
    term: "Gas Fees",
    icon: <Fuel className="h-5 w-5 mr-2 text-primary" />,
    explanation: [
      "Transaction fees paid on a blockchain network, most notably Ethereum, to compensate miners or validators for the computational energy required to process and validate transactions.",
      "Gas fees can fluctuate based on network congestion. Higher congestion typically means higher gas fees."
    ]
  },
  {
    id: "altcoin",
    term: "Altcoin",
    icon: <Shapes className="h-5 w-5 mr-2 text-primary" />,
    explanation: [
      "A term used to describe any cryptocurrency other than Bitcoin (BTC). Thousands of altcoins exist, each with different features, purposes, and technologies. Examples include Ethereum (ETH), Solana (SOL), Cardano (ADA), etc."
    ]
  },
  {
    id: "fiat-currency",
    term: "Fiat Currency",
    icon: <Banknote className="h-5 w-5 mr-2 text-primary" />,
    explanation: [
      "Government-issued currency that is not backed by a physical commodity like gold or silver. Instead, its value is derived from government regulation or law. Examples include the US Dollar (USD), Euro (EUR), Japanese Yen (JPY), etc. Most crypto trading pairs involve fiat currencies."
    ]
  }
];

export function CryptoTerminologyPanel() {
  return (
    <section className="mt-16 mb-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center">
          <BookOpenText className="h-8 w-8 mr-3 text-primary" />
          Crypto Lingo Decoded
        </h2>
        <p className="text-muted-foreground mt-2 md:text-lg">
          Your quick guide to common cryptocurrency terminology.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto space-y-3">
        {terminologyList.map((item) => (
          <AccordionItem key={item.id} value={item.id} className="glass-effect !border-border/50 hover-glow-primary !rounded-xl overflow-hidden">
            <AccordionTrigger className="p-4 text-left hover:no-underline">
              <div className="flex items-center text-base md:text-lg font-medium text-primary-foreground">
                {item.icon}
                {item.term}
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-1">
                {/* Using a simple div here instead of GlassCardRoot to avoid nested card styles if not desired */}
              <div className="!p-4 !bg-transparent !border-none !shadow-none !backdrop-blur-none">
                <div className="!text-sm text-muted-foreground space-y-2">
                  {item.explanation.map((paragraph, index) => (
                    <p key={index} className="mb-2 last:mb-0">{paragraph}</p>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
       <p className="text-center text-xs text-muted-foreground/70 mt-8">
        This glossary provides basic explanations. The crypto world is complex and ever-evolving. Always DYOR.
      </p>
    </section>
  );
}

