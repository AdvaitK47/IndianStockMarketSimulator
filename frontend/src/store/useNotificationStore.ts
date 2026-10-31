import { create } from 'zustand';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'BUY' | 'SELL' | 'LIMIT' | 'STOP_LOSS' | 'DAY_CLOSE' | 'INFO';
  timestamp: string;
  read: boolean;
  dateKey?: string;
  pnl?: number;
  symbol?: string;
  price?: number;
  quantity?: number;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: () => number;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { id?: string }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const STORAGE_KEY = 'stocksim_notifications';

const loadSavedNotifications = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list: AppNotification[] = JSON.parse(raw);
      // Deduplicate DAY_CLOSE notifications so only the latest one persists
      let seenDayClose = false;
      const deduplicated = list.filter((n) => {
        if (n.type === 'DAY_CLOSE') {
          if (seenDayClose) return false;
          seenDayClose = true;
          return true;
        }
        return true;
      });
      return deduplicated;
    }
  } catch (e) {
    // ignore
  }
  return [
    {
      id: 'welcome-notif',
      title: 'Welcome to Stock Market Simulator',
      message: '₹10,00,000 virtual capital has been credited to your trading account.',
      type: 'INFO',
      timestamp: 'Just now',
      read: false,
    },
  ];
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: loadSavedNotifications(),

  unreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },

  addNotification: (notif) => {
    // If notif is DAY_CLOSE, prevent duplicate on the same date!
    if (notif.type === 'DAY_CLOSE') {
      const existing = get().notifications.find(
        (n) => n.type === 'DAY_CLOSE' && (n.dateKey === notif.dateKey || (notif.id && n.id === notif.id))
      );
      if (existing) {
        return; // strictly once per day!
      }
    }

    const newNotif: AppNotification = {
      ...notif,
      id: notif.id || ('notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      read: false,
    };

    set((state) => {
      // Also ensure no duplicate DAY_CLOSE entries in updated list
      const filtered = notif.type === 'DAY_CLOSE'
        ? state.notifications.filter((n) => n.type !== 'DAY_CLOSE')
        : state.notifications;

      const updated = [newNotif, ...filtered].slice(0, 50);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return { notifications: updated };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return { notifications: updated };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return { notifications: updated };
    });
  },

  clearAll: () => {
    set({ notifications: [] });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  },
}));
