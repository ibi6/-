import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AIContext, AIResponse, ChatMessage, FoodRecognitionResult } from '@/types';
import { api } from '@/services/api';
import { AppConfig } from '@/constants';
import { generateId, todayISO } from '@/utils/date';
import { useNutritionStore } from './nutritionStore';
import { useWorkoutStore } from './workoutStore';
import { useUserStore } from './userStore';
import { useHealthStore } from './healthStore';
import { useSubscriptionStore } from './subscriptionStore';
import { DEFAULT_TARGETS } from '@/data';
import { buildNutritionSummary } from '@/utils/nutrition';
import { migratePersistedState, safeAsyncStorage } from './persistStorage';

type ChatState = {
  messages: ChatMessage[];
  isThinking: boolean;
  dailyAiCount: number;
  dailyAiDate: string;
  lastRecognition: FoodRecognitionResult | null;
  error: string | null;

  canSend: () => boolean;
  remainingQuota: () => number;
  send: (text: string) => Promise<AIResponse | null>;
  recognizeFood: (imageUri: string) => Promise<FoodRecognitionResult | null>;
  clearChat: () => void;
  appendSystem: (text: string) => void;
};

function buildContext(): AIContext {
  const nutrition = useNutritionStore.getState();
  const workout = useWorkoutStore.getState();
  const user = useUserStore.getState();
  const health = useHealthStore.getState();
  const summary =
    nutrition.summary ??
    buildNutritionSummary(nutrition.selectedDate, nutrition.meals, nutrition.targets);

  const profile = user.profile ?? {
    id: 'guest',
    name: '访客',
    email: '',
    gender: 'prefer_not_say' as const,
    heightCm: 165,
    weightKg: 60,
    goal: 'keep_fit' as const,
    experience: 'beginner' as const,
    equipment: 'none' as const,
    trainingDaysPerWeek: 3,
    onboardingCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    userProfile: profile,
    todayWorkout: workout.activeSession ?? undefined,
    nutritionSummary: {
      ...summary,
      targets: nutrition.targets ?? DEFAULT_TARGETS,
    },
    recentMeasurements: health.measurements.slice(-7),
  };
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isThinking: false,
      dailyAiCount: 0,
      dailyAiDate: todayISO(),
      lastRecognition: null,
      error: null,

      canSend: () => useSubscriptionStore.getState().isActive || get().remainingQuota() > 0,

      remainingQuota: () => {
        if (useSubscriptionStore.getState().isActive) return Number.POSITIVE_INFINITY;
        const today = todayISO();
        const { dailyAiCount, dailyAiDate } = get();
        if (dailyAiDate !== today) return AppConfig.freeAiMessagesPerDay;
        return Math.max(0, AppConfig.freeAiMessagesPerDay - dailyAiCount);
      },

      send: async (text) => {
        const trimmed = text.trim();
        if (!trimmed || get().isThinking) return null;

        const today = todayISO();
        let { dailyAiCount, dailyAiDate } = get();
        const isPro = useSubscriptionStore.getState().isActive;
        if (dailyAiDate !== today) {
          dailyAiCount = 0;
          dailyAiDate = today;
        }
        if (!isPro && dailyAiCount >= AppConfig.freeAiMessagesPerDay) {
          set({ error: `今日免费 AI 次数已用完（${AppConfig.freeAiMessagesPerDay} 次）` });
          return null;
        }

        const userMsg: ChatMessage = {
          id: generateId('msg'),
          role: 'user',
          text: trimmed,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          messages: [...s.messages, userMsg],
          isThinking: true,
          error: null,
          dailyAiCount: isPro ? dailyAiCount : dailyAiCount + 1,
          dailyAiDate,
        }));

        try {
          const response = await api.ai.sendMessage(trimmed, buildContext());
          const assistant: ChatMessage = {
            id: generateId('msg'),
            role: 'assistant',
            text: response.text,
            createdAt: new Date().toISOString(),
            category: response.category,
            cards: response.cards,
            actions: response.actions,
            disclaimer: response.disclaimer,
          };
          set((s) => ({
            messages: [...s.messages, assistant],
            isThinking: false,
          }));
          return response;
        } catch (e) {
          set({
            isThinking: false,
            dailyAiCount,
            dailyAiDate,
            error:
              e && typeof e === 'object' && 'message' in e
                ? String((e as { message: string }).message)
                : 'AI 暂时不可用',
          });
          return null;
        }
      },

      recognizeFood: async (imageUri) => {
        if (get().isThinking) return null;
        set({ isThinking: true, error: null });
        try {
          const result = await api.ai.recognizeFood(imageUri);
          set({ lastRecognition: result, isThinking: false });
          return result;
        } catch (e) {
          set({
            isThinking: false,
            error:
              e && typeof e === 'object' && 'message' in e
                ? String((e as { message: string }).message)
                : '识别失败',
          });
          return null;
        }
      },

      clearChat: () => set({ messages: [], error: null }),

      appendSystem: (text) => {
        const msg: ChatMessage = {
          id: generateId('msg'),
          role: 'system',
          text,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ messages: [...s.messages, msg] }));
      },
    }),
    {
      name: 'fitai-chat',
      version: AppConfig.storeVersion,
      storage: createJSONStorage(() => safeAsyncStorage),
      migrate: (persistedState) => migratePersistedState<ChatState>(persistedState),
      partialize: (s) => ({
        messages: s.messages.slice(-40),
        dailyAiCount: s.dailyAiCount,
        dailyAiDate: s.dailyAiDate,
      }),
    },
  ),
);
