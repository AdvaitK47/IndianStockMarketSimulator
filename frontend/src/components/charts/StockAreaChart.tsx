import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
} from 'recharts';

export interface CandleData {
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockAreaChartProps {
  candles: CandleData[];
  stockSymbol: string;
  companyName: string;
  currentPrice: number;
  dayChange: number;
  dayChangePct: number;
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

export const StockAreaChart: React.FC<StockAreaChartProps> = ({
  candles = [],
  stockSymbol,
  companyName,
  currentPrice = 0,
  dayChange = 0,
  dayChangePct = 0,
  selectedRange = '1M',
  onRangeChange,
}) => {
  const [chartMode, setChartMode] = useState<'area' | 'line'>('area');
  const timeframes = ['1D', '7D', '1M', '6M', '1Y', 'ALL'];

  // Format data safely
  const formattedData = candles.map((c) => {
    const d = new Date(c.ts);
    let label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    if (selectedRange === '1D') {
      label = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return {
      ...c,
      displayTime: label,
      fullDate: d.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: selectedRange === '1D' ? 'short' : undefined,
      }),
      price: c.close,
      isGreen: c.close >= c.open,
    };
  });

  // Calculate stats for period
  const validLows = candles.map((c) => c.low).filter((v) => typeof v === 'number' && !isNaN(v) && v > 0);
  const validHighs = candles.map((c) => c.high).filter((v) => typeof v === 'number' && !isNaN(v) && v > 0);

  const periodLow = validLows.length ? Math.min(...validLows) : (currentPrice > 0 ? currentPrice * 0.95 : 100);
  const periodHigh = validHighs.length ? Math.max(...validHighs) : (currentPrice > 0 ? currentPrice * 1.05 : 200);
  const spread = periodHigh - periodLow;
  const padding = spread > 0 ? spread * 0.12 : periodLow * 0.05;

  const yMin = Math.max(0, Math.floor(periodLow - padding));
  const yMax = Math.ceil(periodHigh + padding);

  // Overall period trend color: green if period started lower, or use day change
  const isBullish = dayChangePct >= 0;
  const strokeColor = isBullish ? '#10b981' : '#f43f5e';
  const gradientId = isBullish ? 'bullishGradient' : 'bearishGradient';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const change = data.close - data.open;
      const changePct = data.open > 0 ? (change / data.open) * 100 : 0;

      return (
        <div className="bg-zinc-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-zinc-800 text-xs min-w-[210px] space-y-2">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
            <span className="font-semibold text-zinc-400 text-[11px]">{data.fullDate || data.displayTime}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                data.isGreen ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'
              }`}
            >
              {change >= 0 ? '+' : ''}{changePct.toFixed(2)}%
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-zinc-400 text-xs">Close (LTP):</span>
            <span className="font-black text-sm text-white">₹{data.close.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-zinc-300 pt-1 border-t border-zinc-800/60">
            <div>
              <span className="text-zinc-500 mr-1">Open:</span>
              <span className="font-semibold">₹{data.open.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-zinc-500 mr-1">High:</span>
              <span className="font-semibold text-emerald-400">₹{data.high.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-zinc-500 mr-1">Low:</span>
              <span className="font-semibold text-rose-400">₹{data.low.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-zinc-500 mr-1">Vol:</span>
              <span className="font-semibold">{data.volume ? data.volume.toLocaleString() : '—'}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
      {/* Top Header of Chart Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-base">{companyName}</span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-900 text-white font-bold tracking-wider">
              {stockSymbol}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">NSE • Equity</span>
          </div>

          <div className="flex items-baseline gap-3 mt-1.5">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              ₹{currentPrice.toFixed(2)}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                dayChangePct >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
              }`}
            >
              {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)} ({dayChangePct >= 0 ? '+' : ''}{dayChangePct.toFixed(2)}%)
            </span>
          </div>

          {/* Quick Period High / Low stats */}
          <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
            <span>
              Period Low: <strong className="text-slate-800 font-bold">₹{periodLow.toFixed(2)}</strong>
            </span>
            <span>•</span>
            <span>
              Period High: <strong className="text-slate-800 font-bold">₹{periodHigh.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Timeframe Selectors - Matte Black Active State */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1 self-start md:self-auto overflow-x-auto no-scrollbar">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onRangeChange(tf)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedRange === tf
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-black hover:bg-white/60'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Main Area Chart */}
      <div className="h-72 sm:h-80 w-full relative">
        {formattedData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            <span>Loading live market chart...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="bullishGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="60%" stopColor="#10b981" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="bearishGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="60%" stopColor="#f43f5e" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

              <XAxis
                dataKey="displayTime"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={35}
              />

              <YAxis
                domain={[yMin, yMax]}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v.toLocaleString()}`}
                orientation="left"
                width={70}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="close"
                stroke={strokeColor}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                activeDot={{ r: 6, fill: strokeColor, stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Volume Histogram Chart with Green / Red Candlestick bars */}
      <div className="h-20 w-full mt-3 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 px-1">
          <span>Volume (Daily / Interval)</span>
          <span>Avg: {candles.length > 0 ? Math.round(candles.reduce((acc, c) => acc + (c.volume || 0), 0) / candles.length).toLocaleString() : '—'}</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
              {formattedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isGreen ? '#10b98190' : '#f43f5e90'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};