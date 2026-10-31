import { create } from 'zustand';
import api from '../api/client';

export interface User {
  id: number;
  name: string;
  email: string;
  cash_balance: number;
  starting_balance: number;
  realized_pnl_total: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUserBalance: (cash: number) => void;
}

const savedToken = localStorage.getItem('auth_token');

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: savedToken,
  isLoading: !!savedToken,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    set({ token });
  },

  updateUserBalance: (cash) => {
    const cur = get().user;
    if (cur) {
      set({ user: { ...cur, cash_balance: cash } });
    }
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user } = res.data;
    get().setToken(access_token);
    set({ user });
  },

  signup: async (name, email, password) => {
    const res = await api.post('/auth/signup', { name, email, password });
    const { access_token, user } = res.data;
    get().setToken(access_token);
    set({ user });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    get().setToken(null);
    set({ user: null });
  },

  checkAuth: async () => {
    const currentToken = get().token;
    if (!currentToken) {
      set({ user: null, isLoading: false });
      return;
    }
    try {
      set({ isLoading: true });
      const res = await api.get('/auth/me');
      set({ user: res.data, isLoading: false });
    } catch (e) {
      get().setToken(null);
      set({ user: null, isLoading: false });
    }
  },
}));
