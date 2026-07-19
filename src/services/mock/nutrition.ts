import type { NutritionApi } from '@/services/api/interfaces';
import type { Meal } from '@/types';
import { createAppError, mockDelay } from '@/services/api/types';
import {
  DEFAULT_TARGETS,
  buildHistoryMeals,
  getFoodById,
  searchFoods as searchFoodsLocal,
} from '@/data';
import { buildNutritionSummary } from '@/utils/nutrition';
import { readMockData, writeMockData } from './storage';

const MEALS_KEY = 'fitai-mock-meals';

type PersistedMeals = {
  initialized: true;
  meals: Meal[];
};

async function loadMeals(): Promise<Meal[]> {
  const stored = await readMockData<PersistedMeals>(MEALS_KEY);
  if (stored?.initialized === true && Array.isArray(stored.meals)) {
    return stored.meals;
  }
  const meals = buildHistoryMeals();
  await saveMeals(meals);
  return meals;
}

async function saveMeals(meals: Meal[]): Promise<void> {
  await writeMockData<PersistedMeals>(MEALS_KEY, { initialized: true, meals });
}

export const mockNutritionApi: NutritionApi = {
  async getDailySummary(date) {
    await mockDelay();
    const dayMeals = (await loadMeals()).filter((m) => m.date === date);
    return buildNutritionSummary(date, dayMeals, DEFAULT_TARGETS);
  },

  async searchFoods(query) {
    await mockDelay();
    return searchFoodsLocal(query);
  },

  async getFood(id) {
    await mockDelay();
    const food = getFoodById(id);
    if (!food) throw createAppError('NOT_FOUND', '食物不存在', false);
    return food;
  },

  async addMeal(meal) {
    await mockDelay();
    const meals = await loadMeals();
    await saveMeals([...meals.filter((item) => item.id !== meal.id), meal]);
    return meal;
  },

  async updateMeal(meal) {
    await mockDelay();
    const meals = await loadMeals();
    if (!meals.some((item) => item.id === meal.id)) {
      throw createAppError('NOT_FOUND', '餐次不存在', false);
    }
    const updated = { ...meal, updatedAt: new Date().toISOString() };
    await saveMeals(meals.map((item) => (item.id === updated.id ? updated : item)));
    return updated;
  },

  async deleteMeal(mealId) {
    await mockDelay();
    const meals = await loadMeals();
    await saveMeals(meals.filter((item) => item.id !== mealId));
  },
};

export async function __resetMeals() {
  await saveMeals([]);
}
