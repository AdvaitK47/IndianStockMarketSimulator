import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../api/client';
import { OrderModal } from '../components/trading/OrderModal';

export const Watchlist: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<any | null>(null);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const res = await api.get('/watchlist');
      setItems(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleRemove = async (symbol: string) => {
    try {
      await api.delete(`/watchlist/${symbol}`);
      setItems((prev) => prev.filter((i) => i.stock.symbol !== symbol));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Your Watchlist</h1>
          <p className="text-xs text-slate-400">Keep track of your favorite stocks and trade instantly</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bookmark className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-xs">Your watchlist is currently empty.</p>
            <button
              onClick={() => navigate('/stocks')}
              className="mt-3 px-4 py-2 rounded-xl bg-zinc-900 text-white font-bold text-xs"
            >
              Add Stocks from Screener
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/50">
                  <th className="py-3.5 pl-6 font-semibold">Instrument</th>
                  <th className="py-3.5 font-semibold">Sector</th>
                  <th className="py-3.5 font-semibold">LTP (Price)</th>
                  <th className="py-3.5 font-semibold">Day Change</th>
                  <th className="py-3.5 font-semibold">Day High / Low</th>
                  <th className="py-3.5 pr-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => {
                  const s = it.stock;
                  const q = s.quote;
                  return (
                    <tr key={it.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pl-6 cursor-pointer" onClick={() => navigate(`/stocks/${s.symbol}`)}>
                        <p className="font-bold text-slate-900">{s.symbol}</p>
                        <p className="text-[11px] text-slate-400">{s.company_name}</p>
                      </td>
                      <td className="py-3.5 text-slate-600 font-medium">{s.sector || 'N/A'}</td>
                      <td className="py-3.5 font-bold text-slate-900">₹{q ? q.price.toFixed(2) : '—'}</td>
                      <td className="py-3.5">
                        {q && (
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                              q.day_change_pct >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {q.day_change_pct >= 0 ? '+' : ''}{q.day_change_pct.toFixed(2)}%
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-600 font-medium">
                        {q ? `₹${q.day_high.toFixed(2)} / ₹${q.day_low.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3.5 pr-6 text-right space-x-2">
                        <button
                          onClick={() => setSelectedStock({ symbol: s.symbol, company_name: s.company_name, price: q?.price || 2500 })}
                          className="px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white font-bold text-xs shadow-sm hover:bg-indigo-700"
                        >
                          Trade
                        </button>
                        <button
                          onClick={() => handleRemove(s.symbol)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove from watchlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedStock && (
        <OrderModal
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
          stock={selectedStock}
          onOrderSuccess={fetchWatchlist}
        />
      )}
    </div>
  );
};
