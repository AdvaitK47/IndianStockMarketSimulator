import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Clock,
  Briefcase,
} from 'lucide-react';
import api from '../api/client';
import { OrderModal } from '../components/trading/OrderModal';
import { SellConfirmationModal, HoldingToSell } from '../components/trading/SellConfirmationModal';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'holdings' | 'positions' | 'trades' | 'allocation'>('holdings');
  const [summary, setSummary] = useState<any>(null);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [allocation, setAllocation] = useState<any[]>([]);

  // Modals state
  const [selectedStock, setSelectedStock] = useState<any | null>(null);
  const [holdingToSell, setHoldingToSell] = useState<HoldingToSell | null>(null);

  const fetchPortfolio = async () => {
    try {
      const [sumRes, holdRes, posRes, tradeRes, allocRes] = await Promise.all([
        api.get('/portfolio/summary'),
        api.get('/portfolio/holdings'),
        api.get('/portfolio/positions'),
        api.get('/portfolio/trades'),
        api.get('/portfolio/allocation'),
      ]);
      setSummary(sumRes.data);
      setHoldings(holdRes.data);
      setPositions(posRes.data);
      setTrades(tradeRes.data);
      setAllocation(allocRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, []);

  const COLORS = ['#18181b', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899', '#6366f1', '#64748b'];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Top 4 Portfolio Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Total Equity</span>
          <div className="my-2">
            <span className="text-2xl font-black text-slate-900">{formatCurrency(summary?.total_equity)}</span>
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

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Available Cash</span>
          <div className="my-2">
            <span className="text-2xl font-black text-slate-900">{formatCurrency(summary?.cash_balance)}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-400 text-[11px]">Blocked in Orders</span>
            <span className="font-semibold text-slate-700">{formatCurrency(summary?.blocked_in_orders || 0)}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Today's P&L</span>
          <div className="my-2">
            <span
              className={`text-2xl font-black ${
                (summary?.day_pnl || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {(summary?.day_pnl || 0) >= 0 ? '+' : ''}
              {formatCurrency(summary?.day_pnl || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-400 text-[11px]">Day Change</span>
            <span
              className={`font-bold ${
                (summary?.day_pnl_pct || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {(summary?.day_pnl_pct || 0) >= 0 ? '+' : ''}
              {(summary?.day_pnl_pct || 0).toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Realized P&L Total</span>
          <div className="my-2">
            <span
              className={`text-2xl font-black ${
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
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab('holdings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'holdings'
              ? 'bg-zinc-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Holdings ({holdings.length})
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'positions'
              ? 'bg-zinc-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Positions ({positions.length})
        </button>
        <button
          onClick={() => setActiveTab('trades')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'trades'
              ? 'bg-zinc-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Trade History ({trades.length})
        </button>
        <button
          onClick={() => setActiveTab('allocation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'allocation'
              ? 'bg-zinc-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Sector Allocation
        </button>
      </div>

      {/* Tab 1: Holdings Table */}
      {activeTab === 'holdings' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {holdings.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-xs">No equity holdings in portfolio.</p>
              <button
                onClick={() => navigate('/stocks')}
                className="mt-3 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold shadow-md transition-all"
              >
                Buy your first stock
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="py-3.5 pl-6 font-semibold">Instrument</th>
                    <th className="py-3.5 font-semibold">Qty</th>
                    <th className="py-3.5 font-semibold">Avg Buy</th>
                    <th className="py-3.5 font-semibold">LTP</th>
                    <th className="py-3.5 font-semibold">Invested</th>
                    <th className="py-3.5 font-semibold">Current Value</th>
                    <th className="py-3.5 font-semibold">Total P&L</th>
                    <th className="py-3.5 pr-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {holdings.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pl-6">
                        <div
                          className="flex items-center gap-2.5 cursor-pointer"
                          onClick={() => navigate(`/stocks/${h.symbol}`)}
                        >
                          <CompanyLogo symbol={h.symbol} name={h.company_name} size={32} />
                          <div>
                            <span className="font-black text-slate-900 block">{h.symbol}</span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                              {h.company_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 font-bold text-slate-900">{h.quantity}</td>
                      <td className="py-3.5 text-slate-600 font-medium">₹{h.avg_buy_price.toFixed(2)}</td>
                      <td className="py-3.5 font-bold text-slate-900">₹{h.current_price.toFixed(2)}</td>
                      <td className="py-3.5 text-slate-700 font-semibold">{formatCurrency(h.invested_value)}</td>
                      <td className="py-3.5 text-slate-900 font-black">{formatCurrency(h.current_value)}</td>
                      <td className={`py-3.5 font-black ${h.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {h.pnl >= 0 ? '+' : ''}
                        {formatCurrency(h.pnl)} ({h.pnl_pct >= 0 ? '+' : ''}
                        {h.pnl_pct.toFixed(2)}%)
                      </td>
                      <td className="py-3.5 pr-6 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedStock({
                              symbol: h.symbol,
                              company_name: h.company_name,
                              price: h.current_price,
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold border border-emerald-200 transition-colors text-xs"
                        >
                          Buy More
                        </button>
                        <button
                          onClick={() => {
                            setHoldingToSell({
                              symbol: h.symbol,
                              company_name: h.company_name,
                              quantity: h.quantity,
                              avg_buy_price: h.avg_buy_price,
                              current_price: h.current_price,
                              product_type: 'CNC',
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold border border-rose-200 transition-colors text-xs"
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
      )}

      {/* Tab 2: Positions Table */}
      {activeTab === 'positions' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {positions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-xs">No intraday (MIS) positions today.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="py-3.5 pl-6 font-semibold">Instrument</th>
                    <th className="py-3.5 font-semibold">Net Qty</th>
                    <th className="py-3.5 font-semibold">Avg Price</th>
                    <th className="py-3.5 font-semibold">LTP</th>
                    <th className="py-3.5 font-semibold">Margin Blocked</th>
                    <th className="py-3.5 font-semibold">Unrealized P&L</th>
                    <th className="py-3.5 font-semibold">Realized P&L</th>
                    <th className="py-3.5 font-semibold">Status</th>
                    <th className="py-3.5 pr-6 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {positions.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pl-6">
                        <div className="flex items-center gap-2">
                          <CompanyLogo symbol={p.symbol} size={28} />
                          <span className="font-bold text-slate-900">{p.symbol}</span>
                        </div>
                      </td>
                      <td
                        className={`py-3.5 font-black ${
                          p.net_quantity > 0
                            ? 'text-emerald-600'
                            : p.net_quantity < 0
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {p.net_quantity}
                      </td>
                      <td className="py-3.5 text-slate-600 font-medium">₹{p.avg_price.toFixed(2)}</td>
                      <td className="py-3.5 font-bold text-slate-900">₹{p.current_price.toFixed(2)}</td>
                      <td className="py-3.5 text-slate-700 font-semibold">{formatCurrency(p.margin_blocked)}</td>
                      <td
                        className={`py-3.5 font-black ${
                          p.unrealized_pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {p.unrealized_pnl >= 0 ? '+' : ''}
                        {formatCurrency(p.unrealized_pnl)}
                      </td>
                      <td
                        className={`py-3.5 font-black ${
                          p.realized_pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {p.realized_pnl >= 0 ? '+' : ''}
                        {formatCurrency(p.realized_pnl)}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.is_open ? 'bg-zinc-900 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.is_open ? 'OPEN' : 'CLOSED'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-6 text-right">
                        {p.is_open && (
                          <button
                            onClick={() => {
                              setHoldingToSell({
                                symbol: p.symbol,
                                company_name: p.symbol,
                                quantity: Math.abs(p.net_quantity),
                                avg_buy_price: p.avg_price,
                                current_price: p.current_price,
                                product_type: 'MIS',
                              });
                            }}
                            className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition-colors"
                          >
                            Square Off
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Trade History */}
      {activeTab === 'trades' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {trades.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-xs">No executed trades yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="py-3.5 pl-6 font-semibold">Time</th>
                    <th className="py-3.5 font-semibold">Instrument</th>
                    <th className="py-3.5 font-semibold">Side</th>
                    <th className="py-3.5 font-semibold">Product</th>
                    <th className="py-3.5 font-semibold">Qty</th>
                    <th className="py-3.5 font-semibold">Executed Price</th>
                    <th className="py-3.5 font-semibold">Total Value</th>
                    <th className="py-3.5 pr-6 font-semibold text-right">Realized P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trades.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pl-6 text-slate-500 text-[11px]">
                        {new Date(t.executed_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 font-bold text-slate-900">{t.stock_symbol}</td>
                      <td className="py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            t.side === 'BUY'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {t.side}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-600 font-semibold">{t.product_type}</td>
                      <td className="py-3.5 font-bold text-slate-900">{t.quantity}</td>
                      <td className="py-3.5 font-bold text-slate-900">₹{t.price.toFixed(2)}</td>
                      <td className="py-3.5 text-slate-700 font-medium">{formatCurrency(t.total_value)}</td>
                      <td className="py-3.5 pr-6 text-right">
                        {t.realized_pnl !== null ? (
                          <span
                            className={`font-black ${
                              t.realized_pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {t.realized_pnl >= 0 ? '+' : ''}
                            {formatCurrency(t.realized_pnl)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Sector Allocation */}
      {activeTab === 'allocation' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/2 h-64 flex items-center justify-center">
            {allocation.length === 0 ? (
              <p className="text-slate-400 text-xs">No holdings to show allocation.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocation}
                    dataKey="value"
                    nameKey="sector"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {allocation.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="w-full md:w-1/2 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Sector Breakdown</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {allocation.map((item, idx) => (
                <div key={item.sector} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-semibold text-slate-700">{item.sector}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatCurrency(item.value)}</span>
                    <span className="text-slate-400 text-[11px] ml-2">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Buy More Order Modal */}
      {selectedStock && (
        <OrderModal
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
          stock={selectedStock}
          initialSide="BUY"
          onOrderSuccess={fetchPortfolio}
        />
      )}

      {/* Sell Confirmation Modal */}
      {holdingToSell && (
        <SellConfirmationModal
          isOpen={!!holdingToSell}
          onClose={() => setHoldingToSell(null)}
          holding={holdingToSell}
          onSuccess={fetchPortfolio}
        />
      )}
    </div>
  );
};
