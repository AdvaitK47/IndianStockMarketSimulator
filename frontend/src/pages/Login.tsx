import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { SMLogo } from '../components/common/SMLogo';
import {
  Wallet,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
} from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, signup } = useAuthStore();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect immediately to dashboard
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict validation for Sign Up
    if (isSignup) {
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify your passwords.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignup) {
        await signup(name.trim(), email.trim().toLowerCase(), password);
      } else {
        await login(email.trim().toLowerCase(), password);
      }
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.detail;
      if (msg === 'Email already registered') {
        setError('An account with this email already exists. Please Sign In.');
      } else if (msg === 'Incorrect email or password') {
        setError('Invalid email or password. Please verify your credentials.');
      } else {
        setError(msg || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignup(!isSignup);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-zinc-950 flex flex-col md:flex-row items-stretch select-none">
      {/* Left Column (50%): Iconic BSE Bull Visual Showcase */}
      <div className="hidden md:flex md:w-1/2 lg:w-1/2 h-full relative flex-col justify-between p-8 lg:p-12 overflow-hidden bg-black shrink-0">
        {/* BSE Bull Background Image */}
        <img
          src="/bse-bull.jpg"
          alt="BSE Bull Stock Market"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-85"
        />

        {/* Dramatic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/20" />

        {/* Top Header of Left Half */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SMLogo className="w-11 h-11 drop-shadow-md rounded-2xl" size={44} />
            <div>
              <span className="font-black text-white text-base tracking-tight block">
                Stock Market Simulator
              </span>
              <span className="text-[11px] text-zinc-300 font-semibold uppercase tracking-wider block">
                NSE & BSE Paper Trading
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Hero Message of Left Half (Yellow badges & pills removed) */}
        <div className="relative z-10 space-y-3 max-w-xl pb-2">
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight drop-shadow-lg">
            Master the Indian Stock Market.
          </h1>
          <p className="text-xs lg:text-sm text-zinc-200/90 leading-relaxed font-medium">
            Simulate ₹10,00,000 in virtual capital across leading Indian companies with authentic execution, intraday margins, and real market dynamics.
          </p>
        </div>
      </div>

      {/* Right Column (50%): Clean Split Auth Form (Non-scrollable, fits 100vh) */}
      <div className="w-full md:w-1/2 lg:w-1/2 h-full bg-white flex flex-col justify-between p-6 sm:p-8 lg:p-10 overflow-hidden">
        {/* Top bar with Toggle Button */}
        <div className="flex items-center justify-between w-full shrink-0">
          {/* Mobile Logo */}
          <div className="flex md:hidden items-center gap-2.5">
            <SMLogo className="w-9 h-9 rounded-xl" size={36} />
            <span className="font-black text-sm text-zinc-900">Stock Market Simulator</span>
          </div>

          {/* Top-Right Toggle Pill Button */}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-slate-400 font-medium">
              {isSignup ? 'Already have an account?' : 'Need an account?'}
            </span>
            <button
              type="button"
              onClick={toggleAuthMode}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold shadow-md shadow-zinc-200 transition-all hover:scale-105 active:scale-95"
            >
              {isSignup ? 'Sign In' : 'Register'}
            </button>
          </div>
        </div>

        {/* Central Auth Form - Fits vertically without scrolling */}
        <div className="max-w-md w-full mx-auto my-auto space-y-3.5 sm:space-y-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isSignup ? 'Create Virtual Account' : 'Welcome to Stock Market Simulator!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {isSignup
                ? 'Register now to receive ₹10,00,000 virtual capital instantly.'
                : 'Sign in to access your virtual trading account and portfolio.'}
            </p>
          </div>

          {/* Virtual Capital Callout */}
          <div className="p-2.5 sm:p-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-800 font-bold leading-tight">
                ₹10,00,000 Virtual Capital
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Zero real money at stake. Learn, test strategies, and trade risk-free.
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3 text-xs">
            {/* Full Name (Sign Up only) */}
            {isSignup && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Your Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Your Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up only) */}
            {isSignup && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me & Note */}
            {!isSignup && (
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-zinc-900 focus:ring-zinc-900"
                  />
                  <span>Remember Me</span>
                </label>
                <span className="text-slate-400 text-[11px] cursor-pointer hover:underline" title="Passwords are encrypted. If forgotten, create a new virtual account.">
                  Forgot Password?
                </span>
              </div>
            )}

            {/* Primary Action Button - Matte Black */}
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-xl shadow-zinc-200 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Login'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          {/* Bottom Switch Link */}
          <div className="text-center pt-1 text-xs text-slate-500">
            <span>{isSignup ? 'Already have an account? ' : "Don't have an account? "}</span>
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-zinc-900 font-black hover:underline"
            >
              {isSignup ? 'Sign in' : 'Register'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 pt-2 shrink-0">
          <span>Stock Market Simulator © 2026 • Virtual Paper Trading for Educational Use</span>
        </div>
      </div>
    </div>
  );
};
