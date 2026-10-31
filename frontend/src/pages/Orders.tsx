import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, XCircle, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import api from '../api/client';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders${filterStatus !== 'ALL' ? `?status=${filterStatus}` : ''}`);
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const handleCancel = async (id: number) => {
    try {
      await api.delete(`/orders/${id}`);
      fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders Book</h1>
          <p className="text-xs text-slate-400">Track pending, executed, and cancelled market and limit orders</p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          {(['ALL', 'PENDING', 'EXECUTED', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ArrowLeftRight className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-xs">No orders found in this category.</p>
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
                  <th className="py-3.5 font-semibold">Type</th>
                  <th className="py-3.5 font-semibold">Quantity</th>
                  <th className="py-3.5 font-semibold">Limit / Trigger</th>
                  <th className="py-3.5 font-semibold">Status</th>
                  <th className="py-3.5 pr-6 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 pl-6 text-slate-500">{new Date(o.created_at).toLocaleTimeString('en-IN')}</td>
                    <td className="py-3.5 font-bold text-slate-900">{o.stock_symbol}</td>
                    <td className={`py-3.5 font-bold ${o.side === 'BUY' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {o.side}
                    </td>
                    <td className="py-3.5 text-slate-600 font-medium">{o.product_type}</td>
                    <td className="py-3.5 text-slate-800 font-semibold">{o.order_type}</td>
                    <td className="py-3.5 font-semibold text-slate-800">{o.quantity} shares</td>
                    <td className="py-3.5 text-slate-600">
                      {o.limit_price ? `Limit: ₹${o.limit_price.toFixed(2)}` : o.trigger_price ? `Trigger: ₹${o.trigger_price.toFixed(2)}` : 'Market LTP'}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.status === 'EXECUTED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : o.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-6 text-right">
                      {o.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(o.id)}
                          className="px-3 py-1 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs"
                        >
                          Cancel
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
    </div>
  );
};
