import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { CompanyLogo } from '../common/CompanyLogo';

export interface HoldingToSell {
  symbol: string;
  company_name: string;
  quantity: number;
  avg_buy_price: number;
  current_price: number;
  product_type?: 'CNC' | 'MIS';
}

interface SellConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  holding: HoldingToSell | null;
  onSuccess?: () => void;
}

export const SellConfirmationModal: React.FC<SellConfirmationModalProps> = ({
  isOpen,
  onClose,
  holding,
  onSuccess,
}) => {
  const { updateUserBalance } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [quantity, setQuantity] = useState<number>(holding ? holding.quantity : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Post-sale result dialog
  const [soldResult, setSoldResult] = useState<{
    quantity: number;
    soldPrice: number;
    totalAmount: number;
    realizedPnL: number;
    pnlPct: number;
  } | null>(null);

  // Sync quantity when holding changes
  React.useEffect(() => {
    if (holding) {
      setQuantity(holding.quantity);
      setError(null);
      setSoldResult(null);
    }
  }, [holding, isOpen]);

  if (!isOpen || !holding) return null;

  const currentPrice = holding.current_price;
  const avgBuyPrice = holding.avg_buy_price;
  const sellQty = Math.max(1, Math.min(quantity, holding.quantity));
  const estimatedTotal = sellQty * currentPrice;
  const estimatedPnL = (currentPrice - avgBuyPrice) * sellQty;
  const estimatedPnLPct = avgBuyPrice > 0 ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;
  const productType = holding.product_type || 'CNC';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleConfirmSell = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        symbol: holding.symbol,
        side: 'SELL',
        product_type: productType,
        order_type: 'MARKET',
        quantity: sellQty,
        validity: 'DAY',
      };

      const res = await api.post('/orders', payload);
      const data = res.data;

      // Update auth store user balance
      try {
        const meRes = await api.get('/auth/me');
        updateUserBalance(meRes.data.cash_balance);
      } catch (e) {
        // ignore
      }

      const soldPrice = data.execution_price || currentPrice;
      const actualPnL = data.realized_pnl !== null && data.realized_pnl !== undefined
        ? data.realized_pnl
        : (soldPrice - avgBuyPrice) * sellQty;
      const pnlPct = avgBuyPrice > 0 ? (actualPnL / (avgBuyPrice * sellQty)) * 100 : 0;

      // Push notification to bell
      addNotification({
        title: `Sold ${sellQty} ${holding.symbol}`,
        message: `Sold ${sellQty} shares of ${holding.symbol} @ ₹${soldPrice.toFixed(2)}. Realized P&L: ${actualPnL >= 0 ? '+' : ''}${formatCurrency(actualPnL)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)`,
        type: 'SELL',
        symbol: holding.symbol,
        price: soldPrice,
        quantity: sellQty,
        pnl: actualPnL,
      });

      if (onSuccess) {
        onSuccess();
      }

      setSoldResult({
        quantity: sellQty,
        soldPrice,
        totalAmount: sellQty * soldPrice,
        realizedPnL: actualPnL,
        pnlPct,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to execute sell order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <CompanyLogo symbol={holding.symbol} name={holding.company_name} size={42} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-900">{holding.symbol}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                  SELL CONFIRMATION
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">{holding.company_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View 2: Post-Sell Result Receipt */}
        {soldResult ? (
          <div className="p-8 text-center space-y-6 animate-fade-in">
            <div
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-md ${
                soldResult.realizedPnL >= 0
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                  : 'bg-rose-50 border border-rose-200 text-rose-600'
              }`}
            >
              {soldResult.realizedPnL >= 0 ? (
                <CheckCircle2 className="w-9 h-9" />
              ) : (
                <TrendingDown className="w-9 h-9" />
              )}
            </div>

            <div>
              <span
                className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border inline-block ${
                  soldResult.realizedPnL >= 0
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}
              >
                {soldResult.realizedPnL >= 0 ? 'Sold with Profit' : 'Sold with Loss'}
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                {soldResult.quantity} Shares Sold
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Cash has been credited back to your virtual trading wallet.
              </p>
            </div>

            {/* Receipt Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2.5 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Instrument:</span>
                <span className="font-bold text-slate-900">{holding.symbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Quantity Sold:</span>
                <span className="font-bold text-slate-900">{soldResult.quantity} Shares</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Selling Price (LTP):</span>
                <span className="font-black text-slate-950 text-sm">
                  ₹{soldResult.soldPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Total Cash Credited:</span>
                <span className="font-black text-slate-900">
                  {formatCurrency(soldResult.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-800 font-bold">Realized Profit / Loss:</span>
                <span
                  className={`font-black text-base ${
                    soldResult.realizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {soldResult.realizedPnL >= 0 ? '+' : ''}
                  {formatCurrency(soldResult.realizedPnL)} ({soldResult.pnlPct >= 0 ? '+' : ''}
                  {soldResult.pnlPct.toFixed(2)}%)
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-sm shadow-lg shadow-zinc-200 transition-all hover:scale-105"
            >
              Done
            </button>
          </div>
        ) : (
          /* View 1: Pre-Sell Confirmation Form */
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Do you want to sell {holding.symbol}?
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Choose how many shares you would like to sell from your position.
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Quantity to Sell:</span>
                <span className="text-slate-500 text-[11px]">
                  Total Available: <strong className="text-slate-800">{holding.quantity} Shares</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={holding.quantity}
                  value={quantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 1;
                    setQuantity(Math.max(1, Math.min(v, holding.quantity)));
                  }}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:border-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(holding.quantity)}
                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs transition-colors"
                >
                  Sell All ({holding.quantity})
                </button>
              </div>

              {/* Quick Preset Buttons if multiple shares */}
              {holding.quantity > 1 && (
                <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-slate-400 font-medium">Quick Select:</span>
                  {[1, 5, 10, 25]
                    .filter((n) => n < holding.quantity)
                    .map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setQuantity(n)}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
                      >
                        {n} Shares
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.ceil(holding.quantity / 2))}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Half ({Math.ceil(holding.quantity / 2)})
                  </button>
                </div>
              )}
            </div>

            {/* Estimated P&L and Metrics Preview */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Avg Buy Price:</span>
                <span className="font-bold text-slate-900">₹{avgBuyPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Current LTP (Selling At):</span>
                <span className="font-bold text-slate-900">₹{currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Total Expected Value:</span>
                <span className="font-bold text-slate-900">{formatCurrency(estimatedTotal)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                <span className="font-bold text-slate-800">Estimated Profit / Loss:</span>
                <span
                  className={`font-black text-sm flex items-center gap-1 ${
                    estimatedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {estimatedPnL >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {estimatedPnL >= 0 ? '+' : ''}
                  {formatCurrency(estimatedPnL)} ({estimatedPnLPct >= 0 ? '+' : ''}
                  {estimatedPnLPct.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSell}
                disabled={loading}
                className="py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Selling...' : `Confirm & Sell ${sellQty} Shares`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
