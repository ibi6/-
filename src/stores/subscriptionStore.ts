import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SubscriptionPlan, SubscriptionState } from '@/types';
import { AppConfig } from '@/constants';
import { migratePersistedState, safeAsyncStorage } from './persistStorage';

type SubStore = SubscriptionState & {
  upgradeMock: (plan: Extract<SubscriptionPlan, 'pro_monthly' | 'pro_yearly'>) => void;
  restoreMock: () => void;
  cancelMock: () => void;
};

const free: SubscriptionState = {
  plan: 'free',
  isActive: false,
  trialUsed: false,
};

export const useSubscriptionStore = create<SubStore>()(
  persist(
    (set) => ({
      ...free,
      upgradeMock: (plan) => {
        const days = plan === 'pro_yearly' ? 365 : 30;
        const expires = new Date();
        expires.setDate(expires.getDate() + days);
        set({
          plan,
          expiresAt: expires.toISOString(),
          isActive: true,
          trialUsed: true,
        });
      },
      restoreMock: () => {
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        set({
          plan: 'pro_monthly',
          expiresAt: expires.toISOString(),
          isActive: true,
          trialUsed: true,
        });
      },
      cancelMock: () => set({ ...free, trialUsed: true }),
    }),
    {
      name: 'fitai-subscription',
      version: AppConfig.storeVersion,
      storage: createJSONStorage(() => safeAsyncStorage),
      migrate: (persistedState) => migratePersistedState<SubStore>(persistedState),
    },
  ),
);
