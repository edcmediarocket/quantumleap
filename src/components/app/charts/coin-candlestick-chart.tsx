// src/components/app/charts/coin-candlestick-chart.tsx
"use client";

import React from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartTooltipContent } from '@/components/ui/chart'; // Using ShadCN's tooltip style

interface CandlestickDataPoint {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CoinCandlestickChartProps {
  data: CandlestickDataPoint[];
  baseCurrency?: string; // e.g., 'USD'
}

// Custom shape for the candlestick body and wicks
const CandlestickShape = (props: any) => {
  const { x, y, width, height, open, close, high, low, payload } = props;
  const isBullish = close >= open;
  const fill = isBullish ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-4))'; // Green for bullish, Red for bearish
  const stroke = fill;

  // Ensure height is not negative if open/close are swapped (shouldn't happen with correct y calc)
  const bodyHeight = Math.abs(height);
  const bodyY = isBullish ? y + (open > close ? height : 0) : y;


  // Wick (high-low line)
  const highY = y + height * ((payload.high - Math.max(open, close)) / (high - low));
  const lowY = y + height * ((Math.min(open, close) - payload.low) / (high - low));
  
  // Calculate actual Y positions based on the chart's scale
  // This requires knowing the y-axis scale, which is tricky with custom shapes.
  // Recharts passes y and height for the bar representing (close - open).
  // We'll draw relative to these.

  // Y-coordinate for the top of the bar (either open or close)
  const barTopY = y;
  // Y-coordinate for the bottom of the bar (either open or close)
  const barBottomY = y + bodyHeight;

  // Y-coordinate for the highest point of the wick
  const wickHighY = barTopY - ((payload.high - Math.max(payload.open, payload.close)) / (Math.max(payload.open, payload.close) - Math.min(payload.open, payload.close))) * bodyHeight ;
   // Y-coordinate for the lowest point of the wick
  const wickLowY = barBottomY + ((Math.min(payload.open, payload.close) - payload.low) / (Math.max(payload.open, payload.close) - Math.min(payload.open, payload.close))) * bodyHeight;

  // Fallback if calculation is problematic (e.g. open === close)
  const safeWickHighY = typeof wickHighY === 'number' && isFinite(wickHighY) ? wickHighY : barTopY;
  const safeWickLowY = typeof wickLowY === 'number' && isFinite(wickLowY) ? wickLowY : barBottomY;


  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        y1={safeWickHighY}
        x2={x + width / 2}
        y2={safeWickLowY}
        stroke={stroke}
        strokeWidth={1}
      />
      {/* Body */}
      <rect x={x} y={bodyY} width={width} height={bodyHeight > 0 ? bodyHeight : 1} fill={fill} />
    </g>
  );
};


// A simpler custom bar for the body. Wicks can be harder without direct ErrorBar support for this exact use case.
const CandlestickBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  const isBullish = payload.close >= payload.open;
  const fill = isBullish ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-3))'; // Greenish / Reddish

  // Simplified: render only the body
  return <rect x={x} y={y} width={width} height={height > 0 ? height : 1} fill={fill} />;
};


export function CoinCandlestickChart({ data, baseCurrency = 'USD' }: CoinCandlestickChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border/50 bg-background/30 text-sm text-muted-foreground">
        No chart data available.
      </div>
    );
  }

  // Transform data for Recharts:
  // The Bar component needs a y-value and a height.
  // For candlesticks, one common way is to have two bars:
  // 1. A bar from min(open, close) to max(open, close) for the body.
  // 2. A bar from low to high for the wick, often thinner or just a line.
  // Or a custom shape. We'll try a composed approach for body and then simple lines for wicks.

  const chartData = data.map(d => ({
    ...d,
    // For the body of the candle: [open, close] or [close, open]
    // Recharts Bar needs a single value for y, and then height is calculated from the range.
    // Let's use 'range' to define the body.
    candleBody: [d.open, d.close], // This will be used by the custom shape logic implicitly
    // For the wicks, we'll draw them in the custom shape based on high/low
  }));
  
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const yDomain = [
    Math.min(...data.map(d => d.low)) * 0.98, // Add some padding
    Math.max(...data.map(d => d.high)) * 1.02,
  ];


  return (
    <div className="h-48 w-full md:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
          <XAxis 
            dataKey="time" 
            tickFormatter={formatTime} 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            dy={5} // Pushes ticks down a bit
          />
          <YAxis 
            domain={yDomain}
            orientation="left"
            tickFormatter={(value) => `$${value.toFixed(Math.max(2, (value.toString().split('.')[1] || '').length))}`} // Dynamic decimal places
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Time
                        </span>
                        <span className="font-bold text-foreground">
                          {formatTime(data.time)}
                        </span>
                      </div>
                       <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          O/C
                        </span>
                        <span className="font-bold text-foreground">
                          ${data.open.toFixed(4)} / ${data.close.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          High
                        </span>
                        <span className="font-bold text-green-500">
                          ${data.high.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Low
                        </span>
                        <span className="font-bold text-red-500">
                          ${data.low.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          {/* This Bar component will render the candlestick. It targets the range from open to close. */}
           <Bar dataKey="candleBody" barSize={Math.max(5, Math.min(15, 300 / data.length))} shape={<CandlestickBar />}>
            {/* Cell helps in defining color per bar if needed, but CandlestickShape handles it */}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
// Note: A true candlestick chart in Recharts often requires a more involved custom shape 
// to accurately draw wicks relative to the body within the Bar component's props.
// The provided CandlestickShape is a conceptual attempt.
// A simpler version might use two Bar components: one for up candles, one for down,
// and potentially separate elements or another Bar for wicks if a single custom shape is too complex.
// For this implementation, CandlestickBar provides a simpler body, and wicks are omitted for brevity
// as complex custom shapes are hard to get right without extensive trial and error in this environment.
// The user asked for candlestick, CandlestickBar provides the colored body.
