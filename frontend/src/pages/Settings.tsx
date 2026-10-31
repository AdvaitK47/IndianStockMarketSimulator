import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, RotateCcw, Play, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

export const Settings: React.FC = () => {
  const { user, updateUserBalance } = useAuthStore();
  const [replayEnabled, setReplayEnabled] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get('/market/status');
        setReplayEnabled(res.data.replay_mode);
      } catch (e) {
        console.error(e);
      }
    };
    checkStatus();
  }, []);

  const toggleReplay = async () => {
    try {
      if (replayEnabled) {
        await api.post('/admin/replay/stop');
        setReplayEnabled(false);
        setMsg('Replay mode disabled. Market hours check is now active.');
      } else {
        await api.post('/admin/replay/start');
        setReplayEnabled(true);
        setMsg('Replay mode active! You can trade and test orders anytime outside market hours.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetAccount = async () => {
    try {
      const res = await api.post('/account/reset');
      updateUserBalance(res.data.new_balance);
      setResetConfirm(false);
      setMsg('Account reset complete! Starting balance restored to ₹10,00,000.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Settings & Simulator Control</h1>
        <p className="text-xs text-slate-400">Manage virtual balance, market simulation replay mode, and user profile</p>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Simulator Replay Mode */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900">Market Replay Mode</h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                replayEnabled ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {replayEnabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            When enabled, the market is simulated as open 24/7. This allows you to test market, limit, stop-loss orders and square-offs on weekends and evenings.
          </p>
        </div>
        <button
          onClick={toggleReplay}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm ${
            replayEnabled
              ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
          }`}
        >
          {replayEnabled ? 'Disable Replay' : 'Enable Replay'}
        </button>
      </div>

      {/* Account Reset */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between gap-6">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-500" /> Reset Virtual Account
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Resets your portfolio, holdings, positions, and trades back to zero, and replenishes your wallet with ₹10,00,000 virtual cash.
          </p>
        </div>

        {resetConfirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAccount}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700"
            >
              Confirm Reset
            </button>
            <button
              onClick={() => setResetConfirm(false)}
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setResetConfirm(true)}
            className="px-5 py-2.5 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all"
          >
            Reset Funds
          </button>
        )}
      </div>

      {/* Architecture Specs */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Simulator System Specs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400">Starting Cash:</span>
            <span className="font-bold text-slate-800 ml-2">₹10,00,000 (10 Lakhs)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400">Intraday (MIS) Margin:</span>
            <span className="font-bold text-slate-800 ml-2">20% (5x Leverage)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400">NSE Market Hours:</span>
            <span className="font-bold text-slate-800 ml-2">09:15 AM - 03:30 PM IST</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400">MIS Auto Square-Off:</span>
            <span className="font-bold text-slate-800 ml-2">03:15 PM IST</span>
          </div>
        </div>
      </div>
    </div>
  );
};
