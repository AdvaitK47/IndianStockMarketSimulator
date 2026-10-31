import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

export const TradePage: React.FC = () => {
  const { symbol = 'RELIANCE' } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { user, updateUserBalance } = useAuthStore();

  const [stock, setStock] = useState<any | null>(null);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [productType, setProductType] = useState<'CNC' | 'MIS'>('CNC');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'SL_M'>('MARKET');
  const [quantity, setQuantity] = useState<number>(1);
  const [limitPrice, setLimitPrice] = useState<string>('2500.00');
  const [triggerPrice, setTriggerPrice] = useState<string>('2400.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await api.get(`/stocks/${symbol}`);
        setStock(res.data);
        if (res.data.quote) {
          setLimitPrice(res.data.quote.price.toFixed(2));
          setTriggerPrice((res.data.quote.price * 0.95).toFixed(2));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchStock();
  }, [symbol]);

  const currentPrice = stock?.quote?.price || 2500;
  const effectivePrice = orderType === 'LIMIT' ? (parseFloat(limitPrice) || currentPrice) : currentPrice;
  const tradeValue = quantity * effectivePrice;
  const requiredFunds = productType === 'MIS' ? tradeValue * 0.2 : (side === 'BUY' ? tradeValue : 0);
  const availableCash = user?.cash_balance || 0;
  const hasEnoughFunds = side === 'SELL' && productType === 'CNC' ? true : availableCash >= requiredFunds;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in first.');
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload: any = {
        symbol: stock?.symbol || symbol,
        side,
        product_type: productType,
        order_type: orderType,
        quantity: Number(quantity),
        validity: 'DAY',
      };

      if (orderType === 'LIMIT') {
        payload.limit_price = parseFloat(limitPrice);
      } else if (orderType === 'SL_M') {
        payload.trigger_price = parseFloat(triggerPrice);
      }

      const res = await api.post('/orders', payload);
      setSuccess(`Order successfully submitted! Status: ${res.data.status}`);

      try {
        const meRes = await api.get('/auth/me');
        updateUserBalance(meRes.data.cash_balance);
      } catch (err) {
        // ignore
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Order placement failed.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button and title */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/stock/${symbol}`)}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {symbol} Overview
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Dedicated Trading Terminal</span>
        </div>
      </div>

      {/* Main Terminal Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        {/* Stock Top Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
              {symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">{stock?.company_name || symbol}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">{stock?.exchange || 'NSE'}</span>
              </div>
              <p className="text-xs text-slate-400">{stock?.sector || 'Equity Market'}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-slate-900">₹{currentPrice.toFixed(2)}</span>
            <p className="text-xs font-bold text-emerald-600">
              +{stock?.quote?.day_change_pct ? stock.quote.day_change_pct.toFixed(2) : '1.42'}% Today
            </p>
          </div>
        </div>

        {/* 2-Column Trade Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6">
          {/* Left Inputs (7 cols) */}
          <div className="md:col-span-7 space-y-5">
            {/* BUY / SELL Switch */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Action</label>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSide('BUY')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    side === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  BUY (LONG)
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SELL')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    side === 'SELL'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  SELL (SHORT)
                </button>
              </div>
            </div>

            {/* Product Type */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Product Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProductType('CNC')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    productType === 'CNC'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800">Delivery (CNC)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Cash & Carry for long-term</p>
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('MIS')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    productType === 'MIS'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold text-indigo-700">Intraday (MIS)</p>
                  <p className="text-[11px] text-indigo-500 mt-0.5">5x Leverage • Square-off 3:15</p>
                </button>
              </div>
            </div>

            {/* Order Type */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Order Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['MARKET', 'LIMIT', 'SL_M'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOrderType(t)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      orderType === t
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t === 'SL_M' ? 'Stop-Loss' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</label>
                <div className="flex gap-1 text-[11px]">
                  {[1, 5, 10, 25, 50].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, prev + q))}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                    >
                      +{q}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Price Inputs */}
            {orderType === 'LIMIT' && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Limit Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {orderType === 'SL_M' && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Trigger Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  value={triggerPrice}
                  onChange={(e) => setTriggerPrice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Right Summary (5 cols) */}
          <div className="md:col-span-5 bg-slate-50 p-6 rounded-3xl border border-slate-200/80 flex flex-col justify-between space-y-6 text-xs">
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900">Order Calculations</h3>

              <div className="space-y-2.5">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Value:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(tradeValue)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Required Margin:</span>
                  <span className="font-extrabold text-indigo-700">{formatCurrency(requiredFunds)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Available Balance:</span>
                  <span className={`font-semibold ${!hasEnoughFunds ? 'text-rose-600' : 'text-slate-800'}`}>
                    {formatCurrency(availableCash)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Brokerage:</span>
                  <span className="font-semibold text-emerald-600">₹0.00</span>
                </div>
                <div className="flex justify-between text-slate-500 border-t border-slate-200 pt-2.5">
                  <span>Remaining Cash:</span>
                  <span className="font-black text-slate-900">{formatCurrency(Math.max(0, availableCash - requiredFunds))}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !hasEnoughFunds}
              className={`w-full py-3.5 rounded-2xl text-xs font-bold text-white shadow-lg transition-all ${
                side === 'BUY'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
              } disabled:opacity-50`}
            >
              {loading ? 'Submitting...' : `Submit ${side} Order`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
