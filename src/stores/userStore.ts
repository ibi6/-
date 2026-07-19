import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@/types';
import { api } from '@/services/api';
import { AppConfig } from '@/constants';

type UserState = {
  profile: UserProfile | null;
  onboardingDone: boolean;
  isLoading: boolean;
  loadProfile: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  setOnboardingDone: (done: boolean) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      onboardingDone: false,
      isLoading: false,

      loadProfile: async () => {
        set({ isLoading: true });
        try {
          const profile = await api.auth.getProfile();
          set({
            profile,
            onboardingDone: profile?.onboardingCompleted ?? get().onboardingDone,
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      updateProfile: async (patch) => {
        const saved = await api.auth.updateProfile(patch);
        set({
          profile: saved,
          onboardingDone: saved.onboardingCompleted,
        });
      },

      completeOnboarding: async (profile) => {
        const saved = await api.auth.updateProfile({
          ...profile,
          onboardingCompleted: true,
        });
        set({ profile: saved, onboardingDone: true });
      },

      setOnboardingDone: (done) => set({ onboardingDone: done }),
    }),
    {
      name: 'fitai-user',
      version: AppConfig.storeVersion,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ profile: s.profile, onboardingDone: s.onboardingDone }),
    },
  ),
);
