import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_TARGETS } from '@/data';
import { __resetMockAuth } from '@/services/mock/auth';
import { todayISO } from '@/utils/date';
import { useAuthStore } from './authStore';
import { useChatStore } from './chatStore';
import { useHealthStore } from './healthStore';
import { useNutritionStore } from './nutritionStore';
import { useSettingsStore } from './settingsStore';
import { useSubscriptionStore } from './subscriptionStore';
import { useUserStore } from './userStore';
import { useWorkoutStore } from './workoutStore';

export const FITAI_ACTIVITY_STORAGE_KEYS = [
  'fitai-workout',
  'fitai-nutrition',
  'fitai-health',
  'fitai-chat',
  'fitai-mock-workout-sessions',
  'fitai-mock-meals',
  'fitai-mock-measurements',
] as const;

export const FITAI_ALL_STORAGE_KEYS = [
  'fitai-auth',
  'fitai-user',
  'fitai-settings',
  'fitai-subscription',
  'fitai-mock-profile',
  'fitai-mock-token',
  ...FITAI_ACTIVITY_STORAGE_KEYS,
] as const;

const ACTIVITY_STORAGE_KEY_SET = new Set<string>(FITAI_ACTIVITY_STORAGE_KEYS);
const ALL_STORAGE_KEY_SET = new Set<string>(FITAI_ALL_STORAGE_KEYS);

export function selectFitAIStorageKeys(
  keys: readonly string[],
  scope: 'activity' | 'all' = 'all',
): string[] {
  const allowed = scope === 'activity' ? ACTIVITY_STORAGE_KEY_SET : ALL_STORAGE_KEY_SET;
  return keys.filter((key) => allowed.has(key));
}

type StoreReset = () => unknown;

async function resetStores(...resets: StoreReset[]): Promise<void> {
  await Promise.all(resets.map((reset) => reset()));
}

async function resetActivityStores(): Promise<void> {
  const workoutReset = {
    weeklyPlan: null,
    sessions: [],
    activeSession: null,
    phase: 'idle' as const,
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    restSecondsLeft: 0,
    isLoading: false,
    isSavingSet: false,
    isAdjustingPlan: false,
    error: null,
  };

  await resetStores(
    () => useWorkoutStore.setState(workoutReset),
    () =>
      useNutritionStore.setState({
        selectedDate: todayISO(),
        summary: null,
        meals: [],
        mealsByDate: {},
        searchResults: [],
        targets: DEFAULT_TARGETS,
        isLoading: false,
        error: null,
      }),
    () => useHealthStore.setState({ measurements: [], isLoading: false, error: null }),
    () =>
      useChatStore.setState({
        messages: [],
        isThinking: false,
        dailyAiCount: 0,
        dailyAiDate: todayISO(),
        lastRecognition: null,
        error: null,
      }),
  );
}

export async function clearActivityData(): Promise<void> {
  await resetActivityStores();
  await AsyncStorage.multiRemove([...FITAI_ACTIVITY_STORAGE_KEYS]);
}

/**
 * Removes all account-scoped FitAI data from storage and active Zustand stores.
 * Unrelated AsyncStorage keys are never touched.
 */
export async function clearLocalData(): Promise<void> {
  __resetMockAuth();
  await Promise.all([
    resetStores(
      () =>
        useAuthStore.setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }),
      () =>
        useUserStore.setState({
          profile: null,
          onboardingDone: false,
          isLoading: false,
        }),
      () =>
        useSubscriptionStore.setState({
          plan: 'free',
          isActive: false,
          trialUsed: false,
          expiresAt: undefined,
        }),
      () =>
        useSettingsStore.setState({
          units: 'metric',
          language: 'zh',
          haptics: true,
          notifications: true,
          restTimerSound: true,
          darkMode: false,
        }),
    ),
    resetActivityStores(),
  ]);
  await AsyncStorage.multiRemove([...FITAI_ALL_STORAGE_KEYS]);
}
