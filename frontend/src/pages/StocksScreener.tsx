import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, Bookmark, BookmarkCheck, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { OrderModal } from '../components/trading/OrderModal';
import { CompanyLogo } from '../components/common/CompanyLogo';

export const StocksScreener: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stocks, setStocks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [sortKey, setSortKey] = useState('change');
  const [loading, setLoading] = useState(true);
  const [orderStock, setOrderStock] = useState<any | null>(null);

  const sectors = [
    'All',
    'Financial Services',
    'Information Technology',
    'Consumer Goods',
    'Automobile',
    'Healthcare',
    'Energy',
    'Capital Goods',
    'Utilities',
    'Metals & Mining',
  ];

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/stocks?search=${encodeURIComponent(search)}&sector=${encodeURIComponent(selectedSector)}&sort=${sortKey}`);
      setStocks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(() => {
      fetchStocks();
    }, 60000);
    return () => clearInterval(interval);
  }, [search, selectedSector, sortKey]);

  const toggleWatchlist = async (e: React.MouseEvent, symbol: string, inWatch: boolean) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (inWatch) {
        await api.delete(`/watchlist/${symbol}`);
      } else {
        await api.post(`/watchlist/${symbol}`);
      }
      setStocks((prev) =>
        prev.map((s) => (s.symbol === symbol ? { ...s, in_watchlist: !inWatch } : s))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Stocks</h1>
          <p className="text-xs text-slate-400">Discover and trade 100+ leading Indian NSE companies with real live prices</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>15m Delayed • Updates every 1 min</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search symbol or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Sector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar py-1">
          {sectors.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSector === sec
                  ? 'bg-zinc-900 text-white shadow-sm font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 shrink-0 text-xs">
          <span className="text-slate-400 font-medium">Sort by:</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="change">Top Movers (%)</option>
            <option value="price">Highest Price</option>
            <option value="volume">Highest Volume</option>
            <option value="market_cap">Market Cap</option>
          </select>
        </div>
      </div>

      {/* Stocks Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="py-3.5 pl-6 font-semibold w-10"></th>
                <th className="py-3.5 font-semibold">Instrument</th>
                <th className="py-3.5 font-semibold">Sector</th>
                <th className="py-3.5 font-semibold">LTP (Price)</th>
                <th className="py-3.5 font-semibold">Day Change</th>
                <th className="py-3.5 font-semibold">Market Cap</th>
                <th className="py-3.5 font-semibold">Volume</th>
                <th className="py-3.5 pr-6 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stocks.map((s) => {
                const q = s.quote;
                const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
                  <tr
                    key={s.symbol}
                    onClick={() => navigate(`/stock/${s.symbol}`)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 pl-6">
                      <button
                        onClick={(e) => toggleWatchlist(e, s.symbol, !!s.in_watchlist)}
                        className="text-slate-300 hover:text-amber-500 transition-colors"
                      >
                        {s.in_watchlist ? (
                          <BookmarkCheck className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <CompanyLogo symbol={s.symbol} name={s.company_name} size={32} />
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-black transition-colors">
                            {s.symbol}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{s.company_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-500 font-medium">{s.sector || 'N/A'}</td>
                    <td className="py-3.5 font-bold text-slate-900">
                      {q ? formatCurrency(q.price) : '—'}
                    </td>
                    <td className="py-3.5">
                      {q ? (
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            q.day_change_pct >= 0
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {q.day_change_pct >= 0 ? '+' : ''}{q.day_change_pct.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">0.00%</span>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-700 font-semibold">
                      {s.market_cap ? `₹${Number(s.market_cap).toLocaleString('en-IN')} Cr` : '—'}
                    </td>
                    <td className="py-3.5 text-slate-500 font-medium">
                      {q ? q.volume.toLocaleString() : '—'}
                    </td>
                    <td className="py-3.5 pr-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderStock(s);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white shadow-sm font-bold text-xs transition-all"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {orderStock && (
        <OrderModal
          isOpen={!!orderStock}
          onClose={() => setOrderStock(null)}
          stock={{
            symbol: orderStock.symbol,
            company_name: orderStock.company_name,
            price: orderStock.quote?.price || 2500,
          }}
          onOrderSuccess={fetchStocks}
        />
      )}
    </div>
  );
};
