
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
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassCardDescription,
} from "./glass-card";
import { Brain, Search, Users, LineChart, Rss, Bot } from 'lucide-react';

const aiLogicTopics = [
  {
    id: "core-logic",
    title: "AI's Core Decision Process",
    icon: <Bot className="h-5 w-5 mr-2 text-primary" />,
    description: "Our AI synthesizes data from multiple advanced analytical techniques to identify potential crypto opportunities. It doesn't just look at one factor, but a confluence of signals.",
    content: [
      "The AI operates on a sophisticated framework that integrates various data streams and analytical models. Here's a simplified overview of its process:",
      "1. **Data Ingestion:** Real-time and historical market data, news feeds, social media sentiment, on-chain metrics, and more are continuously fed into the system.",
      "2. **Feature Extraction:** Key indicators and patterns are extracted. This includes technical analysis patterns (RSI, MACD, moving averages, chart formations), fundamental analysis data (project updates, tokenomics, team activity), sentiment scores, and unusual whale movements.",
      "3. **Signal Generation:** Each analytical module (NLP, TA, On-Chain) generates signals based on its specialized analysis. For example, a sudden spike in positive sentiment might be a bullish signal, while a large outflow from an exchange by whales could be another.",
      "4. **Signal Weighting & Aggregation:** Not all signals are equal. The AI uses a dynamic weighting system, which can be influenced by current market conditions and the type of query (e.g., meme coin hunt vs. stable profit goal), to score and aggregate these signals.",
      "5. **Opportunity Identification:** Coins that cross certain aggregated signal thresholds and align with user-defined parameters (like profit target or risk tolerance) are flagged as potential opportunities.",
      "6. **Rationale & Strategy Formulation:** For identified opportunities, the AI generates a human-readable rationale explaining its 'thinking' and formulates potential trading strategies, considering entry/exit points and risk factors.",
      "7. **Continuous Learning (Conceptual):** While this specific implementation doesn't feature live model retraining, the underlying LLM is pre-trained on vast datasets, embodying a form of learned intelligence. Future versions could incorporate feedback loops for refinement.",
      "This multi-faceted approach aims to provide nuanced insights beyond simple indicators."
    ]
  },
  {
    id: "nlp-sentiment",
    title: "Natural Language Processing (NLP) & Sentiment Analysis",
    icon: <Search className="h-5 w-5 mr-2 text-accent" />,
    description: "The AI scans news articles, social media, and forums to gauge the emotional tone and key topics surrounding cryptocurrencies.",
    content: [
      "NLP allows the AI to understand and interpret human language from various online sources. Sentiment analysis, a subset of NLP, focuses on determining the emotional tone—positive, negative, or neutral—expressed in text.",
      "**How it works:**",
      "- **Data Collection:** The AI accesses a wide array of text data, including financial news sites, crypto-focused media, Twitter/X, Reddit (e.g., r/CryptoCurrency, specific coin subreddits), Telegram channel discussions (public ones), and more.",
      "- **Text Processing:** Raw text is cleaned and preprocessed (e.g., removing irrelevant characters, tokenization into words/phrases).",
      "- **Sentiment Scoring:** Sophisticated algorithms, often based on machine learning models trained on labeled financial and crypto text, assign sentiment scores to pieces of text. These models can recognize context, sarcasm (to a degree), and crypto-specific jargon.",
      "- **Trend Aggregation:** Sentiment scores are aggregated over time and across sources for specific coins or the market as a whole. The AI looks for significant shifts in sentiment, an increasing volume of positive/negative mentions, or divergences between price action and sentiment.",
      "**Impact:** A sudden surge in positive sentiment backed by credible news might indicate a potential upward price movement. Conversely, widespread FUD (Fear, Uncertainty, Doubt) can signal bearish pressure."
    ]
  },
  {
    id: "whale-tracking",
    title: "Whale Transaction Monitoring",
    icon: <Users className="h-5 w-5 mr-2 text-green-500" />,
    description: "Tracks large transactions by significant holders ('whales') which can indicate potential market moves.",
    content: [
      "'Whales' are individuals or entities holding large amounts of a particular cryptocurrency. Their transactions can significantly impact the market due to the sheer volume.",
      "**How it works (Conceptual):**",
      "- **On-Chain Analysis:** The AI (or more accurately, data services it might conceptually draw from) monitors public blockchain explorers for unusually large transactions moving to or from exchanges, or between wallets known to belong to whales.",
      "- **Pattern Recognition:** The AI looks for patterns such as:",
      "  - Large inflows to exchanges: Potentially indicates whales are preparing to sell.",
      "  - Large outflows from exchanges: Could mean whales are accumulating and moving coins to cold storage for holding.",
      "  - Accumulation by known whale wallets: Suggests bullish sentiment from large players.",
      "  - Splitting or consolidating large amounts: May precede significant buy/sell orders.",
      "**Impact:** Whale movements are often leading indicators. While not foolproof (whales can also make mistakes or manipulate markets), their actions provide valuable clues about potential supply/demand shifts."
    ]
  },
  {
    id: "price-volume",
    title: "Price & Volume Analysis (Technical Analysis)",
    icon: <LineChart className="h-5 w-5 mr-2 text-red-500" />,
    description: "Analyzes historical price charts and trading volumes to identify trends, support/resistance levels, and patterns.",
    content: [
      "Technical Analysis (TA) is a trading discipline employed to evaluate investments and identify trading opportunities by analyzing statistical trends gathered from trading activity, such as price movement and volume.",
      "**Key elements the AI considers:**",
      "- **Trends:** Identifying uptrends, downtrends, and sideways consolidations.",
      "- **Support & Resistance:** Key price levels where a coin has historically struggled to fall below (support) or rise above (resistance). Breakouts or breakdowns of these levels are significant.",
      "- **Moving Averages:** Indicators like the 50-day or 200-day moving average help smooth out price data to identify longer-term trends.",
      "- **Volume Analysis:** Trading volume confirms the strength of a price move. A price increase on high volume is more significant than one on low volume.",
      "- **Chart Patterns:** Recognizing patterns like head and shoulders, triangles, flags, and wedges that can indicate potential future price direction.",
      "- **Oscillators:** Indicators like RSI (Relative Strength Index) and MACD (Moving Average Convergence Divergence) help identify overbought/oversold conditions and momentum shifts.",
      "**Impact:** TA helps the AI to suggest optimal entry and exit points and assess the probability of a trend continuing or reversing."
    ]
  },
  {
    id: "hype-monitoring",
    title: "Social Hype & Trend Monitoring",
    icon: <Rss className="h-5 w-5 mr-2 text-yellow-500" />,
    description: "Monitors social media platforms for trending coins, rapidly increasing mentions, and viral narratives, especially for meme coins.",
    content: [
      "For certain cryptocurrencies, especially meme coins, social hype and narrative can be a primary driver of price action, often outweighing fundamentals.",
      "**How it works:**",
      "- **Keyword Tracking:** The AI monitors specific keywords, hashtags, and coin tickers across platforms like Twitter/X, Reddit, and potentially Telegram (public channels).",
      "- **Mention Velocity:** It looks for a rapid increase in the frequency of mentions for a particular coin, which can indicate growing interest or a coordinated effort.",
      "- **Influencer Activity:** Mentions by prominent crypto influencers can significantly impact a coin's visibility and price.",
      "- **Narrative Analysis:** The AI tries to identify emerging narratives or themes that are capturing attention (e.g., a new type of 'dog coin', a coin associated with a current event).",
      "- **Community Engagement:** Metrics like new members in a coin's Telegram group or subreddit, or the number of retweets/likes on key posts, can signal growing hype.",
      "**Impact:** For highly speculative assets like meme coins, identifying a hype cycle early can be crucial for quick flip opportunities. However, hype is fickle and can dissipate rapidly, making these trades extremely risky."
    ]
  }
];

export function HowItWorksPanel() {
  return (
    <section className="mt-16 mb-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center">
          <Brain className="h-8 w-8 mr-3 text-primary" />
          How Our AI Thinks
        </h2>
        <p className="text-muted-foreground mt-2 md:text-lg">
          Get a glimpse into the analytical techniques powering your crypto insights.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto space-y-3">
        {aiLogicTopics.map((topic) => (
          <AccordionItem key={topic.id} value={topic.id} className="glass-effect !border-border/50 hover-glow-primary !rounded-xl overflow-hidden">
            <AccordionTrigger className="p-4 text-left hover:no-underline">
              <div className="flex items-center text-base md:text-lg font-medium text-primary-foreground">
                {topic.icon}
                {topic.title}
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-1">
              <GlassCardRoot className="!p-4 !bg-transparent !border-none !shadow-none !backdrop-blur-none">
                <GlassCardContent className="!text-sm">
                  <p className="text-muted-foreground mb-3 italic">{topic.description}</p>
                  {topic.content.map((paragraph, index) => (
                    <p key={index} className="mb-2 last:mb-0">{paragraph}</p>
                  ))}
                </GlassCardContent>
              </GlassCardRoot>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
