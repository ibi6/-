import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FoodItem, Meal, MealFood, MealType, NutritionSummary, NutritionTargets } from '@/types';
import { api } from '@/services/api';
import { AppConfig } from '@/constants';
import { DEFAULT_TARGETS, getFoodById } from '@/data';
import { buildNutritionSummary, computeMealFoodNutrients } from '@/utils/nutrition';
import { generateId, todayISO } from '@/utils/date';

type NutritionState = {
  selectedDate: string;
  summary: NutritionSummary | null;
  meals: Meal[];
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
      searchResults: [],
      targets: DEFAULT_TARGETS,
      isLoading: false,
      error: null,

      setDate: (date) => {
        set({ selectedDate: date });
        void get().loadDay(date);
      },

      setTargets: (t) => {
        set({ targets: t });
        const { selectedDate, meals } = get();
        set({ summary: buildNutritionSummary(selectedDate, meals, t) });
      },

      loadDay: async (date) => {
        const d = date ?? get().selectedDate;
        set({ isLoading: true, error: null });
        try {
          const summary = await api.nutrition.getDailySummary(d);
          set({
            selectedDate: d,
            summary: { ...summary, targets: get().targets },
            meals: summary.meals,
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
        const d = date ?? get().selectedDate;
        const food = getFoodById(foodId) ?? (await api.nutrition.getFood(foodId));
        const nutrients = computeMealFoodNutrients(food.per100g, weightG);
        const mealFood: MealFood = {
          id: generateId('mf'),
          foodId: food.id,
          name: food.name,
          weightG,
          ...nutrients,
        };

        const existing = get().meals.find((m) => m.date === d && m.mealType === mealType);
        let meal: Meal;
        if (existing) {
          meal = {
            ...existing,
            foods: [...existing.foods, mealFood],
            updatedAt: new Date().toISOString(),
          };
          meal = await api.nutrition.updateMeal(meal);
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

        const meals = [...get().meals.filter((m) => m.id !== meal.id), meal].filter(
          (m) => m.date === d,
        );
        const summary = buildNutritionSummary(d, meals, get().targets);
        set({ meals, summary });
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
          set({ meals, summary });
          return;
        }
        const saved = await api.nutrition.updateMeal(next);
        const meals = get().meals.map((m) => (m.id === saved.id ? saved : m));
        const summary = buildNutritionSummary(get().selectedDate, meals, get().targets);
        set({ meals, summary });
      },

      deleteMeal: async (mealId) => {
        await api.nutrition.deleteMeal(mealId);
        const meals = get().meals.filter((m) => m.id !== mealId);
        const summary = buildNutritionSummary(get().selectedDate, meals, get().targets);
        set({ meals, summary });
      },
    }),
    {
      name: 'fitai-nutrition',
      version: AppConfig.storeVersion,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ targets: s.targets, selectedDate: s.selectedDate }),
    },
  ),
);
