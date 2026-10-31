import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { CompanyLogo } from '../common/CompanyLogo';

interface StockInfo {
  symbol: string;
  company_name: string;
  price: number;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockInfo;
  initialSide?: 'BUY' | 'SELL';
  onOrderSuccess?: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  stock,
  initialSide = 'BUY',
  onOrderSuccess,
}) => {
  const { user, updateUserBalance } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [side, setSide] = useState<'BUY' | 'SELL'>(initialSide);
  const [productType, setProductType] = useState<'CNC' | 'MIS'>('CNC');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'SL_M'>('MARKET');
  const [quantity, setQuantity] = useState<number>(1);
  const [limitPrice, setLimitPrice] = useState<string>(stock.price.toFixed(2));
  const [triggerPrice, setTriggerPrice] = useState<string>((stock.price * 0.95).toFixed(2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Post-execution confirmation dialog state
  const [executedOrder, setExecutedOrder] = useState<any | null>(null);

  useEffect(() => {
    setSide(initialSide);
    setLimitPrice(stock.price.toFixed(2));
    setTriggerPrice((stock.price * 0.95).toFixed(2));
    setError(null);
    setExecutedOrder(null);
  }, [stock, initialSide, isOpen]);

  if (!isOpen) return null;

  const currentP = stock.price;
  const effectivePrice = orderType === 'LIMIT' ? parseFloat(limitPrice) || currentP : currentP;
  const tradeValue = quantity * effectivePrice;
  const requiredFunds = productType === 'MIS' ? tradeValue * 0.2 : side === 'BUY' ? tradeValue : 0;
  const availableCash = user?.cash_balance || 0;
  const hasEnoughFunds = side === 'SELL' && productType === 'CNC' ? true : availableCash >= requiredFunds;
  const balanceAfterTrade = availableCash - requiredFunds;

  const handleQuickQty = (add: number) => {
    setQuantity((prev) => Math.max(1, prev + add));
  };

  const handleMaxQty = () => {
    if (side === 'BUY') {
      const maxQty =
        productType === 'MIS'
          ? Math.floor(availableCash / (effectivePrice * 0.2))
          : Math.floor(availableCash / effectivePrice);
      setQuantity(Math.max(1, maxQty));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in first to place trades.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        symbol: stock.symbol,
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
      const data = res.data;

      // Update user balance
      try {
        const meRes = await api.get('/auth/me');
        updateUserBalance(meRes.data.cash_balance);
      } catch (err) {
        // ignore
      }

      const fillPrice = data.execution_price || effectivePrice;
      const totalAmount = fillPrice * quantity;

      // Add to notification center
      addNotification({
        title: `${side === 'BUY' ? 'Bought' : 'Sold'} ${quantity} ${stock.symbol}`,
        message: `${side === 'BUY' ? 'Bought' : 'Sold'} ${quantity} shares of ${stock.symbol} @ ₹${fillPrice.toFixed(2)} (${productType} ${orderType})`,
        type: side === 'BUY' ? 'BUY' : 'SELL',
        symbol: stock.symbol,
        price: fillPrice,
        quantity,
        pnl: data.realized_pnl,
      });

      if (onOrderSuccess) {
        onOrderSuccess();
      }

      // Show order confirmation modal
      setExecutedOrder({
        ...data,
        fillPrice,
        totalAmount,
        side,
        productType,
        orderType,
        quantity,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to place order. Check funds or market hours.');
    } finally {
      setLoading(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <CompanyLogo symbol={stock.symbol} name={stock.company_name} size={42} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-900">{stock.symbol}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                  NSE
                </span>
                <span className="text-xs font-black text-slate-900">₹{stock.price.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">{stock.company_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If Order is Executed, Show Order Confirmation Screen */}
        {executedOrder ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border inline-block ${
                executedOrder.side === 'SELL'
                  ? 'text-rose-700 bg-rose-50 border-rose-200'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
                {executedOrder.side === 'BUY'
                  ? (executedOrder.orderType === 'LIMIT' || executedOrder.orderType === 'SL_M' ? 'Limit Order Placed' : 'Order Confirmed & Executed')
                  : 'Sell Order Confirmed'}
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                {executedOrder.side === 'BUY'
                  ? (executedOrder.orderType === 'LIMIT' || executedOrder.orderType === 'SL_M' ? 'Stock Ordered!' : 'Stock Bought!')
                  : 'Stock Sold!'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {executedOrder.side === 'BUY'
                  ? `Your buy order for ${stock.company_name} has been processed successfully.`
                  : `Your sell order for ${stock.company_name} has been completed.`}
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="w-full max-w-md bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2.5 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Instrument:</span>
                <span className="font-bold text-slate-900">{stock.symbol} ({stock.company_name})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Order Type:</span>
                <span className="font-bold text-slate-900">
                  {executedOrder.productType} • {executedOrder.orderType}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Quantity Filled:</span>
                <span className="font-bold text-slate-900">{executedOrder.quantity} Shares</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Execution Price:</span>
                <span className="font-black text-slate-950 text-sm">
                  ₹{executedOrder.fillPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Total Amount {executedOrder.side === 'BUY' ? 'Deducted' : 'Credited'}:</span>
                <span className="font-black text-base text-zinc-950">
                  {formatCurrency(executedOrder.totalAmount)}
                </span>
              </div>
              {executedOrder.realized_pnl !== null && executedOrder.realized_pnl !== undefined && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Realized P&L:</span>
                  <span className={`font-black text-base ${executedOrder.realized_pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {executedOrder.realized_pnl >= 0 ? '+' : ''}{formatCurrency(executedOrder.realized_pnl)}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full max-w-md py-3 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-sm shadow-lg shadow-zinc-200 transition-all hover:scale-105"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form Body - 2 Columns (Zero Purple, Bolder Black) */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Trade Inputs (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* BUY / SELL Switch */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSide('BUY')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    side === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SELL')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    side === 'SELL'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  SELL
                </button>
              </div>

              {/* Product Type (CNC vs MIS) */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Product</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProductType('CNC')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      productType === 'CNC'
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>Delivery (CNC)</div>
                    <div className="text-[10px] text-slate-400 font-medium">Long-term holding</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductType('MIS')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      productType === 'MIS'
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>Intraday (MIS)</div>
                    <div className="text-[10px] font-bold text-zinc-900">5x Margin</div>
                  </button>
                </div>
              </div>

              {/* Order Type */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Order Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['MARKET', 'LIMIT', 'SL_M'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setOrderType(t)}
                      className={`py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        orderType === t
                          ? 'border-zinc-900 bg-zinc-900 text-white font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t === 'SL_M' ? 'Stop-Loss' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600">Quantity (Shares)</label>
                  <div className="flex gap-1 text-[10px]">
                    {[1, 5, 10, 25].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleQuickQty(chip)}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                      >
                        +{chip}
                      </button>
                    ))}
                    {side === 'BUY' && (
                      <button
                        type="button"
                        onClick={handleMaxQty}
                        className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-black text-white font-bold transition-colors"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              {/* Conditional Inputs: Limit Price */}
              {orderType === 'LIMIT' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Limit Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              )}

              {/* Conditional Inputs: Stop-Loss Trigger */}
              {orderType === 'SL_M' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Trigger Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={triggerPrice}
                    onChange={(e) => setTriggerPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              )}
            </div>

            {/* Right Column: Order Summary (5 cols) */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                <span className="font-black text-slate-900 text-xs uppercase tracking-wider block">
                  Order Summary
                </span>

                <div className="flex justify-between text-slate-500">
                  <span>Trade Value:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(tradeValue)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Required {productType === 'MIS' ? 'Margin' : 'Cash'}:</span>
                  <span className="font-black text-zinc-950 text-sm">
                    {formatCurrency(requiredFunds)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Available Cash:</span>
                  <span className={`font-semibold ${!hasEnoughFunds ? 'text-rose-600' : 'text-slate-800'}`}>
                    {formatCurrency(availableCash)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Charges:</span>
                  <span className="font-semibold text-emerald-600">₹0.00 (Zero)</span>
                </div>
                <div className="flex justify-between text-slate-500 border-t border-slate-200 pt-2">
                  <span>Cash After Trade:</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(Math.max(0, balanceAfterTrade))}
                  </span>
                </div>
              </div>

              {/* Status alerts */}
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Execute Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !hasEnoughFunds}
                  className={`w-full py-3 rounded-xl text-xs font-black text-white shadow-md transition-all ${
                    side === 'BUY'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? 'Executing...' : `${side} ${quantity} ${stock.symbol}`}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
