jest.mock('@/services/api', () => ({
  api: {
    nutrition: {
      getDailySummary: jest.fn(),
      searchFoods: jest.fn(),
      getFood: jest.fn(),
      addMeal: jest.fn(async (meal) => meal),
      updateMeal: jest.fn(async (meal) => meal),
      deleteMeal: jest.fn(async () => undefined),
    },
  },
}));

import type { Meal } from '@/types';
import { useNutritionStore } from '@/stores/nutritionStore';

const date = '2026-07-19';

function breakfast(): Meal {
  return {
    id: 'meal-1',
    date,
    mealType: 'breakfast',
    foods: [
      {
        id: 'meal-food-1',
        foodId: 'food-1',
        name: '鸡蛋',
        weightG: 100,
        calories: 150,
        protein: 12,
        carbs: 1,
        fat: 10,
      },
    ],
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
  };
}

describe('nutrition store persistence', () => {
  beforeEach(() => {
    const meal = breakfast();
    useNutritionStore.setState({
      selectedDate: date,
      meals: [meal],
      mealsByDate: { [date]: [meal] },
      summary: null,
      error: null,
    });
  });

  it('removes an empty meal from both current state and the date cache', async () => {
    await useNutritionStore.getState().removeMealFood('meal-1', 'meal-food-1');

    expect(useNutritionStore.getState().meals).toEqual([]);
    expect(useNutritionStore.getState().mealsByDate[date]).toEqual([]);
  });

  it('rejects food records for a future date', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-19T12:00:00.000Z'));
    try {
      await expect(
        useNutritionStore.getState().addFoodToMeal({
          mealType: 'lunch',
          foodId: 'food_chicken',
          weightG: 150,
          date: '2026-07-20',
        }),
      ).rejects.toThrow('未来日期');
    } finally {
      jest.useRealTimers();
    }
  });
});
