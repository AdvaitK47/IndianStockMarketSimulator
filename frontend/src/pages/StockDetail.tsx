import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import api from '../api/client';
import { StockAreaChart, CandleData } from '../components/charts/StockAreaChart';
import { OrderModal } from '../components/trading/OrderModal';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { useAuthStore } from '../store/useAuthStore';

interface QuoteData {
  price: number;
  prev_close: number;
  open: number;
  day_high: number;
  day_low: number;
  volume: number;
  day_change: number;
  day_change_pct: number;
  week52_high?: number;
  week52_low?: number;
  return_1m_pct?: number;
  return_6m_pct?: number;
  return_1y_pct?: number;
  avg_volume_20d?: number;
}

interface StockData {
  id: number;
  symbol: string;
  yf_symbol: string;
  exchange: string;
  company_name: string;
  sector?: string;
  industry?: string;
  description?: string;
  market_cap?: number;
  pe_ratio?: number;
  dividend_yield?: number;
  quote?: QuoteData;
  in_watchlist?: boolean;
}

interface ComparisonStock {
  symbol: string;
  company_name: string;
  price: number;
  day_change_pct: number;
}

export const StockDetail: React.FC = () => {
  const { symbol = 'RELIANCE' } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [stock, setStock] = useState<StockData | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [selectedRange, setSelectedRange] = useState<string>('1M');
  const [comparisonStocks, setComparisonStocks] = useState<ComparisonStock[]>([]);
  const [inWatchlist, setInWatchlist] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [orderModalOpen, setOrderModalOpen] = useState<boolean>(false);
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');

  const activeSymbol = (stock?.symbol || symbol).toUpperCase();

  // Load stock detail
  const fetchStockDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/stocks/${symbol.toUpperCase()}`);
      if (res.data) {
        setStock(res.data);
        setInWatchlist(!!res.data.in_watchlist);
      }
    } catch (e) {
      console.error('Failed to load stock details:', e);
    } finally {
      setLoading(false);
    }
  };

  // Load candles independently
  const fetchHistory = async () => {
    try {
      const res = await api.get(`/stocks/${symbol.toUpperCase()}/history?range=${selectedRange}`);
      if (res.data && Array.isArray(res.data)) {
        setCandles(res.data);
      }
    } catch (e) {
      console.error('Failed to load candles:', e);
    }
  };

  // Load comparison Indian stocks
  const fetchComparison = async () => {
    try {
      const res = await api.get('/stocks/compare?symbols=RELIANCE,TCS,HDFCBANK,INFY,ICICIBANK,BHARTIARTL,SBIN,ITC,LT,MARUTI,TITAN,BAJFINANCE');
      if (res.data && Array.isArray(res.data)) {
        const filtered = res.data.filter((c: ComparisonStock) => c.symbol !== symbol.toUpperCase()).slice(0, 8);
        setComparisonStocks(filtered);
      }
    } catch (e) {
      console.error('Failed to load comparison stocks:', e);
    }
  };

  useEffect(() => {
    fetchStockDetail();
    fetchComparison();
    const interval = setInterval(() => {
      fetchStockDetail();
    }, 60000);
    return () => clearInterval(interval);
  }, [symbol]);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(() => {
      fetchHistory();
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedRange, symbol]);

  const toggleWatchlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${activeSymbol}`);
        setInWatchlist(false);
      } else {
        await api.post(`/watchlist/${activeSymbol}`);
        setInWatchlist(true);
      }
    } catch (e) {
      console.error('Failed to toggle watchlist:', e);
    }
  };

  const handleOpenOrder = (side: 'BUY' | 'SELL') => {
    if (!user) {
      navigate('/login');
      return;
    }
    setOrderSide(side);
    setOrderModalOpen(true);
  };

  const companyName = stock?.company_name || activeSymbol;
  const quote = stock?.quote;
  const currentPrice = quote?.price || 0;
  const dayChange = quote?.day_change || 0;
  const dayChangePct = quote?.day_change_pct || 0;

  return (
    <div className="space-y-6">
      {/* 0. Top Back Navigation Bar */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={() => navigate('/stocks')}
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-900 hover:text-white bg-white hover:bg-zinc-900 border border-slate-200 hover:border-zinc-900 px-4 py-2 rounded-2xl shadow-sm transition-all group"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
          <span>← Back to Stocks</span>
        </button>
        <span className="text-xs text-slate-400 font-semibold">
          Overview / Stocks / {activeSymbol}
        </span>
      </div>

      {/* 1. Header Card - Dynamic to the current Indian stock */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Real Company Logo with Matte Black Initial Fallback */}
          <CompanyLogo symbol={activeSymbol} name={companyName} size={56} className="shadow-md" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{companyName}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-bold border border-zinc-200/60">
                {stock?.exchange || 'NSE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {stock?.industry || stock?.sector || 'Diversified / Bluechip'}
            </p>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-slate-900">
                ₹{currentPrice.toFixed(2)}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  dayChangePct >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)} ({dayChangePct >= 0 ? '+' : ''}{dayChangePct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons - Secondary color is MATTE BLACK */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleWatchlist}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
              inWatchlist
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-white text-zinc-900 border-zinc-800 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            {inWatchlist ? <BookmarkCheck className="w-4 h-4 text-emerald-400" /> : <Bookmark className="w-4 h-4" />}
            {inWatchlist ? 'In Watchlist' : '+ Watchlist'}
          </button>

          <button
            onClick={() => handleOpenOrder('BUY')}
            className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 transition-all hover:scale-105 active:scale-95"
          >
            Buy
          </button>

          {/* Secondary Action: SELL in Matte Black */}
          <button
            onClick={() => handleOpenOrder('SELL')}
            className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-200 transition-all hover:scale-105 active:scale-95"
          >
            Sell
          </button>
        </div>
      </div>

      {/* 2. Four Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Market Cap */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Market Cap</span>
          <div className="my-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {stock?.market_cap ? `₹${stock.market_cap.toLocaleString()} Cr` : `₹${Math.round(currentPrice * 65).toLocaleString()} Cr`}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400 text-[11px]">Rank</span>
            <span className="font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> Top Nifty 50
            </span>
          </div>
        </div>

        {/* Card 2: Volume */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Volume</span>
          <div className="my-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {quote?.volume ? quote.volume.toLocaleString() : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400 text-[11px]">20D Avg</span>
            <span className="font-bold text-slate-700">
              {quote?.avg_volume_20d ? quote.avg_volume_20d.toLocaleString() : 'Active'}
            </span>
          </div>
        </div>

        {/* Card 3: 52 Week High */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">52 Week High</span>
          <div className="my-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{quote?.week52_high ? quote.week52_high.toFixed(2) : (currentPrice * 1.15).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400 text-[11px]">52W Range</span>
            <span className="font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> High
            </span>
          </div>
        </div>

        {/* Card 4: 52 Week Low */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">52 Week Low</span>
          <div className="my-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{quote?.week52_low ? quote.week52_low.toFixed(2) : (currentPrice * 0.85).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400 text-[11px]">52W Range</span>
            <span className="font-bold text-rose-500 flex items-center gap-0.5">
              <ArrowDownRight className="w-3.5 h-3.5" /> Support
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Split: Chart + Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Chart and Stock Comparison (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Interactive Chart */}
          <StockAreaChart
            candles={candles}
            stockSymbol={activeSymbol}
            companyName={companyName}
            currentPrice={currentPrice}
            dayChange={dayChange}
            dayChangePct={dayChangePct}
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
          />

          {/* Pure Indian Stock Comparison Grid */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Stock Comparison</h3>
                <p className="text-xs text-slate-400">
                  Compare {companyName}'s performance against other leading Indian companies.
                </p>
              </div>
              <button
                onClick={() => navigate('/stocks')}
                className="px-3.5 py-1.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-900 hover:bg-zinc-900 hover:text-white transition-all shadow-sm"
              >
                See All
              </button>
            </div>

            {/* Comparison Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {comparisonStocks.map((cs) => (
                <div
                  key={cs.symbol}
                  onClick={() => navigate(`/stocks/${cs.symbol}`)}
                  className="p-3.5 rounded-2xl border border-slate-100 hover:border-zinc-800 hover:shadow-md cursor-pointer transition-all bg-slate-50/50 hover:bg-white group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <CompanyLogo symbol={cs.symbol} size={28} />
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        cs.day_change_pct >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {cs.day_change_pct >= 0 ? '↑' : '↓'} {Math.abs(cs.day_change_pct).toFixed(1)}%
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-800 group-hover:text-black transition-colors">
                    {cs.symbol}
                  </p>
                  <p className="font-semibold text-xs text-slate-700 mt-0.5">
                    ₹{cs.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Details Stock Panel (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-base text-slate-900">Details Stock</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {stock?.description ||
                `${companyName} (${activeSymbol}) is listed on the National Stock Exchange of India with strong liquidity and market capitalization.`}
            </p>
          </div>

          {/* Key-Value Metrics List */}
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Company</span>
              <span className="font-bold text-slate-800 text-right">{companyName}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Current Price</span>
              <span className="font-bold text-slate-900">₹{currentPrice.toFixed(2)}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Ticker</span>
              <span className="font-bold text-zinc-900">{activeSymbol}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Change</span>
              <span
                className={`font-bold ${
                  dayChangePct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)} ({dayChangePct >= 0 ? '+' : ''}{dayChangePct.toFixed(2)}%)
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Market Cap</span>
              <span className="font-semibold text-slate-800">
                {stock?.market_cap ? `₹${stock.market_cap.toLocaleString()} Cr` : `₹${Math.round(currentPrice * 65).toLocaleString()} Cr`}
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Volume</span>
              <span className="font-semibold text-slate-800">
                {quote?.volume ? quote.volume.toLocaleString() : '—'}
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">52 Week High</span>
              <span className="font-semibold text-slate-800">
                ₹{quote?.week52_high ? quote.week52_high.toFixed(2) : (currentPrice * 1.15).toFixed(2)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">52 Week Low</span>
              <span className="font-semibold text-slate-800">
                ₹{quote?.week52_low ? quote.week52_low.toFixed(2) : (currentPrice * 0.85).toFixed(2)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">P/E Ratio</span>
              <span className="font-semibold text-slate-800">{stock?.pe_ratio || '24.8'}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Dividend Yield</span>
              <span className="font-semibold text-slate-800">
                {stock?.dividend_yield ? `${stock.dividend_yield}%` : '0.8%'}
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Sector</span>
              <span className="font-semibold text-zinc-900">{stock?.sector || 'Diversified'}</span>
            </div>
          </div>

          {/* Quick Action in Panel - Matte Black */}
          <div className="pt-2">
            <button
              onClick={() => handleOpenOrder('BUY')}
              className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-black text-white font-bold text-xs shadow-md shadow-zinc-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Trade {activeSymbol}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Trade Modal */}
      {stock && (
        <OrderModal
          isOpen={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          stock={{
            symbol: activeSymbol,
            company_name: companyName,
            price: currentPrice,
          }}
          initialSide={orderSide}
          onOrderSuccess={fetchStockDetail}
        />
      )}
    </div>
  );
};