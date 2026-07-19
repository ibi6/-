import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '@/types';
import { api } from '@/services/api';
import { AppConfig } from '@/constants';
import { migratePersistedState, safeAsyncStorage } from './persistStorage';

type UserState = {
  profile: UserProfile | null;
  onboardingDone: boolean;
  isLoading: boolean;
  loadProfile: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  setOnboardingDone: (done: boolean) => void;
};

function canRecoverMockProfile(error: unknown): boolean {
  return (
    process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false' &&
    Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'UNAUTHORIZED')
  );
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      onboardingDone: false,
      isLoading: false,

      loadProfile: async () => {
        set({ isLoading: true });
        try {
          const remoteProfile = await api.auth.getProfile();
          const profile = remoteProfile ?? get().profile;
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
        let saved: UserProfile;
        try {
          saved = await api.auth.updateProfile(patch);
        } catch (error) {
          const current = get().profile;
          if (!current || !canRecoverMockProfile(error)) throw error;
          saved = { ...current, ...patch, updatedAt: new Date().toISOString() };
        }
        set({
          profile: saved,
          onboardingDone: saved.onboardingCompleted,
        });
      },

      completeOnboarding: async (profile) => {
        const completedProfile: UserProfile = {
          ...profile,
          onboardingCompleted: true,
          updatedAt: new Date().toISOString(),
        };
        let saved: UserProfile;
        try {
          saved = await api.auth.updateProfile(completedProfile);
        } catch (error) {
          if (!canRecoverMockProfile(error)) throw error;
          saved = completedProfile;
        }
        set({ profile: saved, onboardingDone: true });
      },

      setOnboardingDone: (done) => set({ onboardingDone: done }),
    }),
    {
      name: 'fitai-user',
      version: AppConfig.storeVersion,
      storage: createJSONStorage(() => safeAsyncStorage),
      migrate: (persistedState) => migratePersistedState<UserState>(persistedState),
      partialize: (s) => ({ profile: s.profile, onboardingDone: s.onboardingDone }),
    },
  ),
);
