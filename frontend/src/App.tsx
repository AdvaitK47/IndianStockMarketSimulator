import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { StockDetail } from './pages/StockDetail';
import { TradePage } from './pages/TradePage';
import { StocksScreener } from './pages/StocksScreener';
import { Portfolio } from './pages/Portfolio';
import { Orders } from './pages/Orders';
import { Watchlist } from './pages/Watchlist';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { useAuthStore } from './store/useAuthStore';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-semibold tracking-wide">Loading Stock Market Simulator...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="stock/:symbol" element={<StockDetail />} />
          <Route path="stocks/:symbol" element={<StockDetail />} />
          <Route path="trade/:symbol" element={<TradePage />} />
          <Route path="stocks" element={<StocksScreener />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="orders" element={<Orders />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="insights" element={<Insights />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
