import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '@/types';
import { api } from '@/services/api';
import { AppConfig } from '@/constants';

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  hydrateDemo: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const user = await api.auth.login(email, password);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (e) {
          const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : '登录失败';
          set({ error: message, isLoading: false });
          throw e;
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const user = await api.auth.register(email, password, name);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (e) {
          const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : '注册失败';
          set({ error: message, isLoading: false });
          throw e;
        }
      },

      logout: async () => {
        try {
          await api.auth.logout();
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      hydrateDemo: async () => {
        set({ isLoading: true });
        try {
          const user = await api.auth.login('demo@fitai.app', 'demo1234');
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'fitai-auth',
      version: AppConfig.storeVersion,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    },
  ),
);
