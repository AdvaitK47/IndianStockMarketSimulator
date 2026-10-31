import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, TrendingDown, ArrowUpRight, BarChart2, ShieldAlert } from 'lucide-react';
import api from '../api/client';

export const Insights: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await api.get('/insights');
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Market Insights</h1>
        <p className="text-xs text-slate-400">Data-driven market scans, momentum trends, and sector heatmaps</p>
      </div>

      {/* Statutory Disclaimer */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center gap-2.5 text-amber-800 text-xs">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
        <span className="font-medium">
          {data?.disclaimer || 'Based on past performance. Not investment advice.'} This paper trading simulator is strictly for educational purposes.
        </span>
      </div>

      {/* Two columns: Top Gainers & Top Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gainers */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Top Gainers
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {(data?.gainers || []).slice(0, 6).map((g: any) => (
              <div
                key={g.symbol}
                onClick={() => navigate(`/stocks/${g.symbol}`)}
                className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
              >
                <div>
                  <p className="font-bold text-slate-800">{g.symbol}</p>
                  <p className="text-[11px] text-slate-400">{g.company_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">₹{g.price.toFixed(2)}</p>
                  <span className="font-bold text-emerald-600">+{g.day_change_pct.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Losers */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-500" /> Top Losers
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {(data?.losers || []).slice(0, 6).map((l: any) => (
              <div
                key={l.symbol}
                onClick={() => navigate(`/stocks/${l.symbol}`)}
                className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
              >
                <div>
                  <p className="font-bold text-slate-800">{l.symbol}</p>
                  <p className="text-[11px] text-slate-400">{l.company_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">₹{l.price.toFixed(2)}</p>
                  <span className="font-bold text-rose-600">{l.day_change_pct.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sector Performance */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-500" /> Sector Performance Today
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {(data?.sectors || []).map((sec: any) => (
            <div key={sec.sector} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-500 font-medium truncate">{sec.sector}</p>
              <p
                className={`font-black text-sm mt-1 ${
                  sec.avg_change_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {sec.avg_change_pct >= 0 ? '+' : ''}{sec.avg_change_pct.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
