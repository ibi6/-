import type { NutritionApi } from '@/services/api/interfaces';
import type { Meal } from '@/types';
import { createAppError, mockDelay } from '@/services/api/types';
import {
  DEFAULT_TARGETS,
  buildHistoryMeals,
  buildSampleMeals,
  getFoodById,
  searchFoods as searchFoodsLocal,
} from '@/data';
import { buildNutritionSummary } from '@/utils/nutrition';
import { todayISO } from '@/utils/date';

const mealsById = new Map<string, Meal>();

function seedIfEmpty() {
  if (mealsById.size === 0) {
    for (const m of buildHistoryMeals()) {
      mealsById.set(m.id, m);
    }
  }
}

export const mockNutritionApi: NutritionApi = {
  async getDailySummary(date) {
    await mockDelay();
    seedIfEmpty();
    const dayMeals = Array.from(mealsById.values()).filter((m) => m.date === date);
    if (dayMeals.length === 0 && date === todayISO()) {
      for (const m of buildSampleMeals(date)) {
        mealsById.set(m.id, m);
        dayMeals.push(m);
      }
    }
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
    mealsById.set(meal.id, meal);
    return meal;
  },

  async updateMeal(meal) {
    await mockDelay();
    if (!mealsById.has(meal.id)) {
      throw createAppError('NOT_FOUND', '餐次不存在', false);
    }
    const updated = { ...meal, updatedAt: new Date().toISOString() };
    mealsById.set(meal.id, updated);
    return updated;
  },

  async deleteMeal(mealId) {
    await mockDelay();
    mealsById.delete(mealId);
  },
};

export function __resetMeals() {
  mealsById.clear();
}
