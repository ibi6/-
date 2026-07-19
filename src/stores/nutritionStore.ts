import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FoodItem, Meal, MealFood, MealType, NutritionSummary, NutritionTargets } from '@/types';
import { api } from '@/services/api';
import { AppConfig } from '@/constants';
import { DEFAULT_TARGETS, getFoodById } from '@/data';
import { buildNutritionSummary, computeMealFoodNutrients } from '@/utils/nutrition';
import { generateId, todayISO } from '@/utils/date';
import { migratePersistedState, safeAsyncStorage } from './persistStorage';

type MealsByDate = Record<string, Meal[]>;

type NutritionState = {
  selectedDate: string;
  summary: NutritionSummary | null;
  meals: Meal[];
  mealsByDate: MealsByDate;
  searchResults: FoodItem[];
  targets: NutritionTargets;
  isLoading: boolean;
  error: string | null;

  setDate: (date: string) => void;
  setTargets: (t: NutritionTargets) => void;
  loadDay: (date?: string) => Promise<void>;
  searchFoods: (q: string) => Promise<void>;
  addFoodToMeal: (params: {
    mealType: MealType;
    foodId: string;
    weightG: number;
    date?: string;
  }) => Promise<void>;
  removeMealFood: (mealId: string, mealFoodId: string) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  clearSearch: () => void;
};

function emptySummary(date: string, targets: NutritionTargets): NutritionSummary {
  return buildNutritionSummary(date, [], targets);
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      selectedDate: todayISO(),
      summary: null,
      meals: [],
      mealsByDate: {},
      searchResults: [],
      targets: DEFAULT_TARGETS,
      isLoading: false,
      error: null,

      setDate: (date) => {
        const cached = get().mealsByDate[date];
        set({
          selectedDate: date,
          meals: cached ?? [],
          summary: cached ? buildNutritionSummary(date, cached, get().targets) : null,
        });
        void get().loadDay(date);
      },

      setTargets: (t) => {
        set({ targets: t });
        const { selectedDate, meals } = get();
        set({ summary: buildNutritionSummary(selectedDate, meals, t) });
      },

      loadDay: async (date) => {
        const d = date ?? get().selectedDate;
        const cached = get().mealsByDate[d];
        if (cached) {
          set({
            selectedDate: d,
            meals: cached,
            summary: buildNutritionSummary(d, cached, get().targets),
            isLoading: false,
            error: null,
          });
          return;
        }
        set({ isLoading: true, error: null });
        try {
          const response = await api.nutrition.getDailySummary(d);
          const meals = response.meals.filter((meal) => meal.date === d);
          set({
            selectedDate: d,
            summary: buildNutritionSummary(d, meals, get().targets),
            meals,
            mealsByDate: { ...get().mealsByDate, [d]: meals },
            isLoading: false,
          });
        } catch (e) {
          set({
            isLoading: false,
            summary: emptySummary(d, get().targets),
            meals: [],
            error:
              e && typeof e === 'object' && 'message' in e
                ? String((e as { message: string }).message)
                : '加载饮食失败',
          });
        }
      },

      searchFoods: async (q) => {
        if (!q.trim()) {
          set({ searchResults: [] });
          return;
        }
        try {
          const searchResults = await api.nutrition.searchFoods(q);
          set({ searchResults });
        } catch {
          set({ searchResults: [] });
        }
      },

      clearSearch: () => set({ searchResults: [] }),

      addFoodToMeal: async ({ mealType, foodId, weightG, date }) => {
        if (!Number.isFinite(weightG) || weightG <= 0 || weightG > 5000) {
          throw new Error('食物重量需在 0–5000 克之间');
        }
        const d = date ?? get().selectedDate;
        if (d > todayISO()) {
          throw new Error('未来日期不能记录已食用食物');
        }
        const state = get();
        const dayMeals = state.mealsByDate[d] ?? (state.selectedDate === d ? state.meals : []);
        const food = getFoodById(foodId) ?? (await api.nutrition.getFood(foodId));
        const nutrients = computeMealFoodNutrients(food.per100g, weightG);
        const mealFood: MealFood = {
          id: generateId('mf'),
          foodId: food.id,
          name: food.name,
          weightG,
          ...nutrients,
        };

        const existing = dayMeals.find((m) => m.mealType === mealType);
        let meal: Meal;
        if (existing) {
          meal = {
            ...existing,
            foods: [...existing.foods, mealFood],
            updatedAt: new Date().toISOString(),
          };
          try {
            meal = await api.nutrition.updateMeal(meal);
          } catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 'NOT_FOUND') {
              meal = await api.nutrition.addMeal(meal);
            } else {
              throw error;
            }
          }
        } else {
          meal = {
            id: generateId('meal'),
            date: d,
            mealType,
            foods: [mealFood],
            note: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          meal = await api.nutrition.addMeal(meal);
        }

        const meals = [...dayMeals.filter((item) => item.id !== meal.id), meal];
        const mealsByDate = { ...get().mealsByDate, [d]: meals };
        if (get().selectedDate === d) {
          set({ meals, mealsByDate, summary: buildNutritionSummary(d, meals, get().targets) });
        } else {
          set({ mealsByDate });
        }
      },

      removeMealFood: async (mealId, mealFoodId) => {
        const meal = get().meals.find((m) => m.id === mealId);
        if (!meal) return;
        const next: Meal = {
          ...meal,
          foods: meal.foods.filter((f) => f.id !== mealFoodId),
          updatedAt: new Date().toISOString(),
        };
        if (next.foods.length === 0) {
          await api.nutrition.deleteMeal(mealId);
          const meals = get().meals.filter((m) => m.id !== mealId);
          const summary = buildNutritionSummary(get().selectedDate, meals, get().targets);
          set({
            meals,
            summary,
            mealsByDate: { ...get().mealsByDate, [get().selectedDate]: meals },
          });
          return;
        }
        let saved: Meal;
        try {
          saved = await api.nutrition.updateMeal(next);
        } catch (error) {
          if (error && typeof error === 'object' && 'code' in error && error.code === 'NOT_FOUND') {
            saved = await api.nutrition.addMeal(next);
          } else {
            throw error;
          }
        }
        const meals = get().meals.map((m) => (m.id === saved.id ? saved : m));
        const summary = buildNutritionSummary(get().selectedDate, meals, get().targets);
        set({
          meals,
          summary,
          mealsByDate: { ...get().mealsByDate, [get().selectedDate]: meals },
        });
      },

      deleteMeal: async (mealId) => {
        await api.nutrition.deleteMeal(mealId);
        const meals = get().meals.filter((m) => m.id !== mealId);
        const summary = buildNutritionSummary(get().selectedDate, meals, get().targets);
        set({
          meals,
          summary,
          mealsByDate: { ...get().mealsByDate, [get().selectedDate]: meals },
        });
      },
    }),
    {
      name: 'fitai-nutrition',
      version: AppConfig.storeVersion,
      storage: createJSONStorage(() => safeAsyncStorage),
      migrate: (persistedState) => migratePersistedState<NutritionState>(persistedState),
      partialize: (s) => ({
        targets: s.targets,
        selectedDate: s.selectedDate,
        mealsByDate: s.mealsByDate,
      }),
    },
  ),
);
