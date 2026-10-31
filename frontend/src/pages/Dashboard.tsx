import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { SellConfirmationModal, HoldingToSell } from '../components/trading/SellConfirmationModal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<any>(null);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Position square off modal
  const [positionToSquareOff, setPositionToSquareOff] = useState<HoldingToSell | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sumRes = await api.get('/portfolio/summary');
      setSummary(sumRes.data);
    } catch (e) {
      console.error('Failed to load portfolio summary', e);
    }

    try {
      const holdRes = await api.get('/portfolio/holdings');
      setHoldings(holdRes.data || []);
    } catch (e) {
      console.error('Failed to load holdings', e);
    }

    try {
      const posRes = await api.get('/portfolio/positions');
      setPositions(posRes.data || []);
    } catch (e) {
      console.error('Failed to load positions', e);
    }

    try {
      const insRes = await api.get('/insights');
      setInsights(insRes.data);
    } catch (e) {
      console.error('Failed to load insights', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Welcome Banner - Matte Black Accent */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-6 sm:p-8 text-white shadow-xl border border-zinc-800">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-zinc-800/40 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] font-bold text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Virtual Paper Trading Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome back, {user ? user.name.split(' ')[0] : 'Trader'}!
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed">
            Trade 100+ leading Indian NSE companies with real 15m delayed quotes, ₹10,00,000 virtual capital, and zero financial risk.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/stocks')}
              className="px-5 py-2.5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-black shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <span>Explore Stocks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Portfolio Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Equity */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Equity</span>
            <Wallet className="w-4 h-4 text-zinc-900" />
          </div>
          <div className="my-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {formatCurrency(summary?.total_equity || user?.starting_balance || 1000000)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-400 text-[11px]">Overall Return</span>
            <span
              className={`font-bold flex items-center gap-0.5 ${
                (summary?.overall_return_pct || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {(summary?.overall_return_pct || 0) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {Math.abs(summary?.overall_return_pct || 0).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Day's P&L */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Day's P&L</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-2">
            <span
              className={`text-xl sm:text-2xl font-black ${
                (summary?.day_pnl || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {(summary?.day_pnl || 0) >= 0 ? '+' : ''}
              {formatCurrency(summary?.day_pnl || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-400 text-[11px]">Holdings Movement</span>
            <span className="font-semibold text-slate-700">Today</span>
          </div>
        </div>

        {/* Realized P&L */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Realized P&L</span>
            <Layers className="w-4 h-4 text-zinc-900" />
          </div>
          <div className="my-2">
            <span
              className={`text-xl sm:text-2xl font-black ${
                (summary?.realized_pnl_total || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {(summary?.realized_pnl_total || 0) >= 0 ? '+' : ''}
              {formatCurrency(summary?.realized_pnl_total || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-400 text-[11px]">Closed Trades</span>
            <span className="font-semibold text-slate-700">All-time</span>
          </div>
        </div>

        {/* Available Cash */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Available Cash</span>
            <Briefcase className="w-4 h-4 text-zinc-900" />
          </div>
          <div className="my-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {formatCurrency(summary?.cash_balance || user?.cash_balance || 1000000)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-400 text-[11px]">Blocked in Orders</span>
            <span className="font-semibold text-slate-700">{formatCurrency(summary?.blocked_in_orders || 0)}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Holdings & Positions vs Market Gainers/Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Open Intraday Positions Card */}
          {positions.filter((p) => p.is_open).length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">Open Intraday Positions (MIS)</h3>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-900 text-xs font-bold border border-zinc-200">
                    {positions.filter((p) => p.is_open).length} Active
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">Auto square-off at 15:15 IST</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100">
                      <th className="pb-3 font-semibold">Instrument</th>
                      <th className="pb-3 font-semibold">Net Qty</th>
                      <th className="pb-3 font-semibold">Avg Price</th>
                      <th className="pb-3 font-semibold">LTP</th>
                      <th className="pb-3 font-semibold">Unrealized P&L</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {positions.filter((p) => p.is_open).map((pos) => (
                      <tr key={pos.id} className="hover:bg-slate-50/50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <CompanyLogo symbol={pos.symbol} size={26} />
                            <span className="font-bold text-slate-900">{pos.symbol}</span>
                          </div>
                        </td>
                        <td className={`py-3 font-black ${pos.net_quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {pos.net_quantity > 0 ? `+${pos.net_quantity} (LONG)` : `${pos.net_quantity} (SHORT)`}
                        </td>
                        <td className="py-3 text-slate-600">₹{pos.avg_price.toFixed(2)}</td>
                        <td className="py-3 text-slate-900 font-bold">₹{pos.current_price.toFixed(2)}</td>
                        <td className={`py-3 font-black ${pos.unrealized_pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {pos.unrealized_pnl >= 0 ? '+' : ''}₹{pos.unrealized_pnl.toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              setPositionToSquareOff({
                                symbol: pos.symbol,
                                company_name: pos.symbol,
                                quantity: Math.abs(pos.net_quantity),
                                avg_buy_price: pos.avg_price,
                                current_price: pos.current_price,
                                product_type: 'MIS',
                              });
                            }}
                            className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold border border-rose-200 transition-colors"
                          >
                            Square Off
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Holdings Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Your Holdings (Delivery)</h3>
                <p className="text-xs text-slate-400">Long-term equity shares held in portfolio</p>
              </div>
              <button
                onClick={() => navigate('/portfolio')}
                className="px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors"
              >
                View All
              </button>
            </div>

            {holdings.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-medium text-xs">No holdings yet.</p>
                <button
                  onClick={() => navigate('/stocks')}
                  className="mt-3 px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-black text-white text-xs font-bold shadow-md shadow-zinc-300 transition-all hover:scale-105 active:scale-95"
                >
                  Buy your first stock
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100">
                      <th className="pb-3 font-semibold">Stock</th>
                      <th className="pb-3 font-semibold">Shares</th>
                      <th className="pb-3 font-semibold">Avg Buy</th>
                      <th className="pb-3 font-semibold">LTP</th>
                      <th className="pb-3 font-semibold">Current Value</th>
                      <th className="pb-3 font-semibold">Total P&L</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {holdings.slice(0, 5).map((h) => (
                      <tr
                        key={h.id}
                        className="hover:bg-slate-50/50"
                      >
                        <td
                          className="py-3 cursor-pointer"
                          onClick={() => navigate(`/stocks/${h.symbol}`)}
                        >
                          <div className="flex items-center gap-2.5">
                            <CompanyLogo symbol={h.symbol} name={h.company_name} size={30} />
                            <div>
                              <p className="font-bold text-slate-900">{h.symbol}</p>
                              <p className="text-[11px] text-slate-400 truncate max-w-[120px]">{h.company_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-bold text-slate-800">{h.quantity}</td>
                        <td className="py-3 text-slate-600">₹{h.avg_buy_price.toFixed(2)}</td>
                        <td className="py-3 font-bold text-slate-900">₹{h.current_price.toFixed(2)}</td>
                        <td className="py-3 font-black text-slate-900">{formatCurrency(h.current_value)}</td>
                        <td className="py-3">
                          <span
                            className={`font-black ${
                              h.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {h.pnl >= 0 ? '+' : ''}₹{h.pnl.toFixed(2)} ({h.pnl_pct >= 0 ? '+' : ''}{h.pnl_pct.toFixed(2)}%)
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              setPositionToSquareOff({
                                symbol: h.symbol,
                                company_name: h.company_name,
                                quantity: h.quantity,
                                avg_buy_price: h.avg_buy_price,
                                current_price: h.current_price,
                                product_type: 'CNC',
                              });
                            }}
                            className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold border border-rose-200 transition-colors"
                          >
                            Sell
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Top Gainers & Losers (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top Gainers */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Top Gainers Today
              </h3>
              <span className="text-[11px] font-bold text-slate-400">NSE</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {(insights?.gainers || []).slice(0, 4).map((g: any) => (
                <div
                  key={g.symbol}
                  onClick={() => navigate(`/stocks/${g.symbol}`)}
                  className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CompanyLogo symbol={g.symbol} name={g.company_name} size={28} />
                    <div>
                      <p className="font-bold text-slate-900">{g.symbol}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[110px]">{g.company_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{g.price.toFixed(2)}</p>
                    <span className="font-bold text-emerald-600 text-[11px]">
                      +{g.day_change_pct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-rose-500" /> Top Losers Today
              </h3>
              <span className="text-[11px] font-bold text-slate-400">NSE</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {(insights?.losers || []).slice(0, 4).map((l: any) => (
                <div
                  key={l.symbol}
                  onClick={() => navigate(`/stocks/${l.symbol}`)}
                  className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CompanyLogo symbol={l.symbol} name={l.company_name} size={28} />
                    <div>
                      <p className="font-bold text-slate-900">{l.symbol}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[110px]">{l.company_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{l.price.toFixed(2)}</p>
                    <span className="font-bold text-rose-600 text-[11px]">
                      {l.day_change_pct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sell / Square Off Confirmation Modal */}
      {positionToSquareOff && (
        <SellConfirmationModal
          isOpen={!!positionToSquareOff}
          onClose={() => setPositionToSquareOff(null)}
          holding={positionToSquareOff}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};
