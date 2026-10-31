import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  day_change: number;
  day_change_pct: number;
  color?: string;
}

const DEFAULT_INDIAN_TICKERS: TickerItem[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 1167.40, day_change: 14.50, day_change_pct: 1.25, color: 'bg-zinc-900' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: 2478.00, day_change: 18.00, day_change_pct: 0.73, color: 'bg-zinc-800' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 683.30, day_change: -2.10, day_change_pct: -0.31, color: 'bg-zinc-900' },
  { symbol: 'INFY', name: 'Infosys Ltd', price: 1146.50, day_change: 23.40, day_change_pct: 2.08, color: 'bg-zinc-800' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1386.60, day_change: 9.80, day_change_pct: 0.71, color: 'bg-zinc-900' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 1972.10, day_change: 22.80, day_change_pct: 1.17, color: 'bg-zinc-800' },
  { symbol: 'SBIN', name: 'State Bank of India', price: 971.90, day_change: 15.30, day_change_pct: 1.60, color: 'bg-zinc-900' },
  { symbol: 'ITC', name: 'ITC Ltd', price: 265.00, day_change: 1.80, day_change_pct: 0.68, color: 'bg-zinc-800' },
  { symbol: 'LT', name: 'Larsen & Toubro', price: 3837.10, day_change: 32.50, day_change_pct: 0.85, color: 'bg-zinc-900' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', price: 11426.00, day_change: 110.00, day_change_pct: 0.97, color: 'bg-zinc-800' },
  { symbol: 'TITAN', name: 'Titan Company', price: 4434.00, day_change: -12.40, day_change_pct: -0.28, color: 'bg-zinc-900' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 938.90, day_change: 8.60, day_change_pct: 0.92, color: 'bg-zinc-800' },
];

export const TickerBar: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<TickerItem[]>(DEFAULT_INDIAN_TICKERS);

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await api.get('/market/ticker');
        if (res.data && res.data.length > 0) {
          setItems(res.data);
        }
      } catch (e) {
        // fallback
      }
    };
    fetchTicker();
    const interval = setInterval(fetchTicker, 20000);
    return () => clearInterval(interval);
  }, []);

  // Duplicate for seamless infinite marquee loop
  const marqueeItems = [...items, ...items];

  return (
    <div className="w-full bg-white border-b border-slate-200/80 overflow-hidden select-none py-2 px-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="animate-marquee flex items-center gap-6">
        {marqueeItems.map((item, idx) => (
          <div
            key={`${item.symbol}-${idx}`}
            onClick={() => navigate(`/stocks/${item.symbol}`)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-75 transition-opacity whitespace-nowrap group shrink-0"
          >
            {/* Matte Black Stock Badge */}
            <div className="w-4 h-4 rounded-full bg-zinc-900 text-white text-[9px] font-black flex items-center justify-center shrink-0">
              {item.symbol.slice(0, 1)}
            </div>

            {/* Symbol */}
            <span className="font-bold text-xs text-slate-800 group-hover:text-black transition-colors">
              {item.symbol}
            </span>

            {/* Price */}
            <span className="text-xs font-semibold text-slate-700">
              ₹{item.price.toFixed(2)}
            </span>

            {/* Change % Badge */}
            <span
              className={`text-[11px] font-bold px-1.5 py-0.2 rounded-md ${
                item.day_change_pct >= 0
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-rose-700 bg-rose-50'
              }`}
            >
              {item.day_change_pct >= 0 ? '+' : ''}{item.day_change_pct.toFixed(2)}%
            </span>

            {/* Vertical separator */}
            <span className="text-slate-200 text-xs ml-3 font-light">|</span>
          </div>
        ))}
      </div>
    </div>
  );
};