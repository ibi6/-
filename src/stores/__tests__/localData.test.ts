import AsyncStorage from '@react-native-async-storage/async-storage';
import * as stores from '@/stores';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useHealthStore } from '@/stores/healthStore';
import { useNutritionStore } from '@/stores/nutritionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useUserStore } from '@/stores/userStore';
import { useWorkoutStore } from '@/stores/workoutStore';

type LocalDataExports = {
  FITAI_ACTIVITY_STORAGE_KEYS?: readonly string[];
  FITAI_ALL_STORAGE_KEYS?: readonly string[];
  selectFitAIStorageKeys?: (keys: string[], scope?: 'activity' | 'all') => string[];
  clearActivityData?: () => Promise<void>;
  clearLocalData?: () => Promise<void>;
};

const localData = stores as typeof stores & LocalDataExports;
const ACTIVITY_STORAGE_KEYS = [
  'fitai-workout',
  'fitai-nutrition',
  'fitai-health',
  'fitai-chat',
  'fitai-mock-workout-sessions',
  'fitai-mock-meals',
  'fitai-mock-measurements',
] as const;
const ALL_STORAGE_KEYS = [
  'fitai-auth',
  'fitai-user',
  'fitai-settings',
  'fitai-subscription',
  'fitai-mock-profile',
  'fitai-mock-token',
  ...ACTIVITY_STORAGE_KEYS,
] as const;

describe('local data privacy', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('selects only explicitly owned keys for each clearing scope', () => {
    expect(localData.FITAI_ACTIVITY_STORAGE_KEYS).toEqual(ACTIVITY_STORAGE_KEYS);
    expect(localData.FITAI_ALL_STORAGE_KEYS).toEqual(ALL_STORAGE_KEYS);
    expect(typeof localData.selectFitAIStorageKeys).toBe('function');
    if (!localData.selectFitAIStorageKeys) return;

    const keys = [
      'fitai-auth',
      'fitai-user',
      'fitai-workout',
      'fitai-mock-meals',
      'fitai-settings',
      'fitai-future-unknown',
      'other-app-cache',
    ];
    expect(localData.selectFitAIStorageKeys(keys, 'all')).toEqual([
      'fitai-auth',
      'fitai-user',
      'fitai-workout',
      'fitai-mock-meals',
      'fitai-settings',
    ]);
    expect(localData.selectFitAIStorageKeys(keys, 'activity')).toEqual([
      'fitai-workout',
      'fitai-mock-meals',
    ]);
  });

  it('clears activity state while preserving account, profile and settings', async () => {
    expect(typeof localData.clearActivityData).toBe('function');
    if (!localData.clearActivityData) return;

    await AsyncStorage.multiSet([
      ...ACTIVITY_STORAGE_KEYS.map((key) => [key, `private:${key}`] as [string, string]),
      ['fitai-mock-profile', '{"name":"private"}'],
      ['fitai-mock-token', 'secret-token'],
      ['fitai-settings', '{"language":"en"}'],
      ['other-app-cache', 'keep-me'],
    ]);
    useAuthStore.setState({
      user: { id: 'u1', email: 'private@example.com', name: 'Private', token: 'secret-token' },
      isAuthenticated: true,
    });
    useUserStore.setState({
      profile: {
        id: 'u1',
        email: 'private@example.com',
        name: 'Private',
        gender: 'prefer_not_say',
        heightCm: 170,
        weightKg: 60,
        goal: 'keep_fit',
        experience: 'beginner',
        equipment: 'none',
        trainingDaysPerWeek: 3,
        onboardingCompleted: true,
        createdAt: '2026-07-19T00:00:00.000Z',
        updatedAt: '2026-07-19T00:00:00.000Z',
      },
      onboardingDone: true,
    });
    useChatStore.setState({
      messages: [
        {
          id: 'm1',
          role: 'user',
          text: 'private chat',
          createdAt: '2026-07-19T00:00:00.000Z',
        },
      ],
      dailyAiCount: 3,
    });
    useHealthStore.setState({
      measurements: [{ id: 'b1', date: '2026-07-19', weightKg: 60 }],
    });
    useSettingsStore.setState({ language: 'en' });
    useWorkoutStore.setState({ sessions: [{ id: 'private-session' } as never] });
    useNutritionStore.setState({ meals: [{ id: 'private-meal' } as never] });

    await localData.clearActivityData();

    expect(useAuthStore.getState().user?.email).toBe('private@example.com');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useUserStore.getState().profile?.email).toBe('private@example.com');
    expect(useChatStore.getState()).toMatchObject({ messages: [], dailyAiCount: 0 });
    expect(useHealthStore.getState().measurements).toEqual([]);
    expect(useWorkoutStore.getState().sessions).toEqual([]);
    expect(useNutritionStore.getState().meals).toEqual([]);
    expect(useSettingsStore.getState().language).toBe('en');
    await expect(AsyncStorage.multiGet([...ACTIVITY_STORAGE_KEYS])).resolves.toEqual(
      ACTIVITY_STORAGE_KEYS.map((key) => [key, null]),
    );
    expect(await AsyncStorage.getItem('fitai-mock-profile')).toBe('{"name":"private"}');
    expect(await AsyncStorage.getItem('fitai-mock-token')).toBe('secret-token');
    expect(await AsyncStorage.getItem('other-app-cache')).toBe('keep-me');
  });

  it('fully clears account data and resets settings for sign-out', async () => {
    expect(typeof localData.clearLocalData).toBe('function');
    if (!localData.clearLocalData) return;

    await AsyncStorage.multiSet([
      ...ALL_STORAGE_KEYS.map((key) => [key, `private:${key}`] as [string, string]),
      ['other-app-cache', 'keep-me'],
    ]);
    useAuthStore.setState({
      user: { id: 'u1', email: 'private@example.com', name: 'Private', token: 'secret-token' },
      isAuthenticated: true,
    });
    useUserStore.setState({
      profile: {
        id: 'u1',
        email: 'private@example.com',
        name: 'Private',
        gender: 'prefer_not_say',
        heightCm: 170,
        weightKg: 60,
        goal: 'keep_fit',
        experience: 'beginner',
        equipment: 'none',
        trainingDaysPerWeek: 3,
        onboardingCompleted: true,
        createdAt: '2026-07-19T00:00:00.000Z',
        updatedAt: '2026-07-19T00:00:00.000Z',
      },
      onboardingDone: true,
    });
    useChatStore.setState({ messages: [{ id: 'm1' } as never], dailyAiCount: 3 });
    useHealthStore.setState({ measurements: [{ id: 'b1' } as never] });
    useWorkoutStore.setState({ sessions: [{ id: 'w1' } as never] });
    useNutritionStore.setState({ meals: [{ id: 'n1' } as never] });
    useSubscriptionStore.setState({
      plan: 'pro_monthly',
      isActive: true,
      trialUsed: true,
      expiresAt: '2026-08-19T00:00:00.000Z',
    });
    useSettingsStore.setState({ language: 'en' });

    await localData.clearLocalData();

    expect(useAuthStore.getState()).toMatchObject({ user: null, isAuthenticated: false });
    expect(useUserStore.getState()).toMatchObject({ profile: null, onboardingDone: false });
    expect(useChatStore.getState()).toMatchObject({ messages: [], dailyAiCount: 0 });
    expect(useHealthStore.getState().measurements).toEqual([]);
    expect(useWorkoutStore.getState().sessions).toEqual([]);
    expect(useNutritionStore.getState().meals).toEqual([]);
    expect(useSubscriptionStore.getState()).toMatchObject({
      plan: 'free',
      isActive: false,
      trialUsed: false,
      expiresAt: undefined,
    });
    expect(useSettingsStore.getState().language).toBe('zh');
    await expect(AsyncStorage.multiGet([...ALL_STORAGE_KEYS])).resolves.toEqual(
      ALL_STORAGE_KEYS.map((key) => [key, null]),
    );
    expect(await AsyncStorage.getItem('other-app-cache')).toBe('keep-me');
  });

  it('surfaces storage failures instead of reporting a false success', async () => {
    expect(typeof localData.clearLocalData).toBe('function');
    if (!localData.clearLocalData) return;

    jest.spyOn(AsyncStorage, 'multiRemove').mockRejectedValueOnce(new Error('storage unavailable'));
    await expect(localData.clearLocalData()).rejects.toThrow('storage unavailable');
  });
});
