import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppSettings } from '@/types';
import { AppConfig } from '@/constants';
import { migratePersistedState, safeAsyncStorage } from './persistStorage';

const defaultSettings: AppSettings = {
  units: 'metric',
  language: 'zh',
  haptics: true,
  notifications: true,
  restTimerSound: true,
  darkMode: false,
};

type SettingsState = AppSettings & {
  update: (patch: Partial<AppSettings>) => void;
  reset: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      update: (patch) => set((s) => ({ ...s, ...patch })),
      reset: () => set({ ...defaultSettings }),
    }),
    {
      name: 'fitai-settings',
      version: AppConfig.storeVersion,
      storage: createJSONStorage(() => safeAsyncStorage),
      migrate: (persistedState) => migratePersistedState<SettingsState>(persistedState),
    },
  ),
);
