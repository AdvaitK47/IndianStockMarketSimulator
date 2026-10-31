import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  LogOut,
  Wallet,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Trash2,
  CheckCheck,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { CompanyLogo } from '../common/CompanyLogo';

interface MarketStatus {
  is_open: boolean;
  status_text: string;
  replay_mode: boolean;
}

export const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, addNotification } =
    useNotificationStore();

  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotificationMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/market/status');
      setMarketStatus(res.data);
    } catch (e) {
      // Calculate realistic fallback based on actual IST time
      const now = new Date();
      // IST is UTC + 5:30
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const istDate = new Date(utcTime + 330 * 60000);
      const day = istDate.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = day === 0 || day === 6;
      const mins = istDate.getHours() * 60 + istDate.getMinutes();
      const inHours = mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30;

      const timeStr = istDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (isWeekend && inHours) {
        setMarketStatus({
          is_open: true,
          status_text: `Replaying Friday's Market (${timeStr} IST)`,
          replay_mode: true,
        });
      } else if (!isWeekend && inHours) {
        setMarketStatus({
          is_open: true,
          status_text: 'Market Live (15m Delayed)',
          replay_mode: false,
        });
      } else {
        setMarketStatus({
          is_open: false,
          status_text: isWeekend ? 'Market Closed (Replay 09:15 IST)' : 'Market Closed (Opens 09:15 IST)',
          replay_mode: false,
        });
      }
    }

    // Independent notification check for day close - strictly once per day!
    try {
      const statusRes = await api.get('/market/status');
      if (!statusRes.data.is_open && user) {
        const todayKey = new Date().toISOString().slice(0, 10);
        const storageKey = `day_close_notif_${user.id}_${todayKey}`;
        const alreadyFiredToday = localStorage.getItem(storageKey);

        if (!alreadyFiredToday) {
          const currentNotifs = useNotificationStore.getState().notifications;
          const hasInStore = currentNotifs.some(
            (n) => n.type === 'DAY_CLOSE' && (n.dateKey === todayKey || n.id.includes(todayKey))
          );
          if (!hasInStore) {
            localStorage.setItem(storageKey, 'true');
            const sumRes = await api.get('/portfolio/summary');
            const dayPnl = sumRes.data?.day_pnl || 0;
            addNotification({
              id: `day_close_${todayKey}`,
              dateKey: todayKey,
              title: 'Market Closed: Day Summary',
              message: `Market session has ended. Today's Net P&L: ${dayPnl >= 0 ? '+' : ''}₹${dayPnl.toFixed(2)}.`,
              type: 'DAY_CLOSE',
              pnl: dayPnl,
            });
          } else {
            localStorage.setItem(storageKey, 'true');
          }
        }
      }
    } catch (err) {
      // ignore notification check errors
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/stocks?search=${encodeURIComponent(searchQuery)}&limit=6`);
        setSearchResults(res.data);
        setShowSearchDropdown(true);
      } catch (e) {
        setSearchResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  let breadcrumb = 'Overview';
  if (location.pathname.startsWith('/stock/') || location.pathname.startsWith('/stocks/')) {
    const sym = location.pathname.split('/')[2];
    breadcrumb = `Overview / Stock (${sym})`;
  } else if (location.pathname === '/stocks') {
    breadcrumb = 'Overview / Stocks';
  } else if (location.pathname === '/portfolio') {
    breadcrumb = 'Overview / Portfolio';
  } else if (location.pathname === '/orders') {
    breadcrumb = 'Overview / Orders';
  } else if (location.pathname === '/watchlist') {
    breadcrumb = 'Overview / Watchlist';
  } else if (location.pathname === '/insights') {
    breadcrumb = 'Overview / Insights';
  } else if (location.pathname === '/settings') {
    breadcrumb = 'Overview / Settings';
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const countUnread = unreadCount();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between gap-6 shrink-0 z-30 select-none">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-black text-slate-800 whitespace-nowrap">
          {breadcrumb}
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3.5 shrink-0">
        {/* Market Status Pill */}
        {marketStatus && (
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              marketStatus.replay_mode
                ? 'bg-zinc-900 text-white border-zinc-800'
                : marketStatus.is_open
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                marketStatus.is_open ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{marketStatus.status_text}</span>
          </div>
        )}

        {/* Virtual Cash Display (Matte Black) */}
        {user && (
          <div
            onClick={() => navigate('/portfolio')}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 text-xs cursor-pointer transition-colors"
            title="Available Virtual Cash"
          >
            <Wallet className="w-3.5 h-3.5 text-zinc-900" />
            <span className="text-slate-500 font-medium">Cash:</span>
            <span className="font-black text-slate-900">{formatCurrency(user.cash_balance)}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative w-44 md:w-56">
          <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-100 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSearchDropdown(true)}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 max-h-60 overflow-y-auto">
              {searchResults.map((s) => (
                <div
                  key={s.symbol}
                  onClick={() => {
                    navigate(`/stocks/${s.symbol}`);
                    setShowSearchDropdown(false);
                    setSearchQuery('');
                  }}
                  className="px-3 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer text-xs border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <CompanyLogo symbol={s.symbol} name={s.company_name} size={24} />
                    <div>
                      <span className="font-black text-slate-900 mr-1.5">{s.symbol}</span>
                      <span className="text-slate-400 text-[10px] truncate inline-block max-w-[100px]">
                        {s.company_name}
                      </span>
                    </div>
                  </div>
                  {s.quote && (
                    <span className="font-bold text-slate-900">₹{s.quote.price.toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell & Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {countUnread > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-black text-[9px] shadow-sm animate-pulse">
                {countUnread}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotificationMenu && (
            <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl py-3 z-50 text-xs overflow-hidden animate-fade-in">
              {/* Header */}
              <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm">Notifications</span>
                  {countUnread > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                      {countUnread} New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {countUnread > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-slate-500 hover:text-zinc-900 font-bold flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Read all</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold flex items-center gap-1 ml-1"
                      title="Clear all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-60" />
                    <p className="font-bold text-xs">No notifications yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Buy, sell, and limit order updates will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                        !n.read ? 'bg-slate-50/70' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'BUY' ? (
                          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                            <TrendingUp className="w-3.5 h-3.5" />
                          </div>
                        ) : n.type === 'SELL' ? (
                          <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                            <TrendingDown className="w-3.5 h-3.5" />
                          </div>
                        ) : n.type === 'LIMIT' || n.type === 'STOP_LOSS' ? (
                          <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        ) : n.type === 'DAY_CLOSE' ? (
                          <div className="w-7 h-7 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-slate-900 text-xs truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-zinc-900 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-black flex items-center justify-center text-xs shadow-sm">
              {user ? user.name.slice(0, 2).toUpperCase() : 'GU'}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs">
              {user ? (
                <>
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="font-black text-slate-900">{user.name}</p>
                    <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-semibold"
                  >
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/login');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-bold"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
