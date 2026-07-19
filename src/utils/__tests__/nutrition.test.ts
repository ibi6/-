import type { Meal } from '@/types';
import {
  buildNutritionSummary,
  computeMealFoodNutrients,
  defaultTargets,
  nutrientForWeight,
  overTargetCopy,
  progressRatio,
  remainingTargets,
  sumNutrients,
} from '@/utils/nutrition';
import * as nutritionUtils from '@/utils/nutrition';

describe('food serving helpers', () => {
  it('parses only finite food weights in the supported range', () => {
    const parseFoodWeight = (nutritionUtils as Record<string, unknown>).parseFoodWeight;

    expect(typeof parseFoodWeight).toBe('function');
    if (typeof parseFoodWeight !== 'function') return;

    expect(parseFoodWeight('150.5')).toBe(150.5);
    expect(parseFoodWeight('')).toBeNull();
    expect(parseFoodWeight('0')).toBeNull();
    expect(parseFoodWeight('-20')).toBeNull();
    expect(parseFoodWeight('Infinity')).toBeNull();
    expect(parseFoodWeight('5001')).toBeNull();
  });

  it('builds practical half, regular and large serving shortcuts', () => {
    const foodServingOptions = (nutritionUtils as Record<string, unknown>).foodServingOptions;

    expect(typeof foodServingOptions).toBe('function');
    if (typeof foodServingOptions !== 'function') return;

    expect(foodServingOptions(150)).toEqual([75, 150, 225]);
    expect(foodServingOptions(Number.NaN)).toEqual([50, 100, 150]);
  });
});

describe('nutrientForWeight', () => {
  it('scales per-100g values and rounds to 1 decimal', () => {
    expect(nutrientForWeight(25, 200)).toBe(50);
    expect(nutrientForWeight(10.5, 50)).toBe(5.3);
  });
});

describe('computeMealFoodNutrients', () => {
  it('computes macros for a given weight', () => {
    const n = computeMealFoodNutrients(
      { calories: 200, protein: 20, carbs: 10, fat: 8 },
      150,
    );
    expect(n.calories).toBe(300);
    expect(n.protein).toBe(30);
    expect(n.carbs).toBe(15);
    expect(n.fat).toBe(12);
  });

  it('never creates negative nutrients from a negative food weight', () => {
    expect(
      computeMealFoodNutrients(
        { calories: 200, protein: 20, carbs: 10, fat: 8 },
        -50,
      ),
    ).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('sumNutrients / remainingTargets', () => {
  it('sums and subtracts targets', () => {
    const consumed = sumNutrients([
      { calories: 100, protein: 10, carbs: 5, fat: 2 },
      { calories: 50, protein: 5.5, carbs: 2.2, fat: 1.1 },
    ]);
    expect(consumed.calories).toBe(150);
    expect(consumed.protein).toBe(15.5);

    const rem = remainingTargets(
      { calories: 2000, protein: 150, carbs: 200, fat: 60 },
      consumed,
    );
    expect(rem.calories).toBe(1850);
    expect(rem.protein).toBe(134.5);
  });
});

describe('progressRatio', () => {
  it('clamps between 0 and 1.2', () => {
    expect(progressRatio(50, 100)).toBe(0.5);
    expect(progressRatio(150, 100)).toBe(1.2);
    expect(progressRatio(-10, 100)).toBe(0);
    expect(progressRatio(10, 0)).toBe(0);
  });

  it('returns zero for non-finite input instead of NaN or Infinity', () => {
    expect(progressRatio(Number.NaN, 100)).toBe(0);
    expect(progressRatio(Number.POSITIVE_INFINITY, 100)).toBe(0);
  });
});

describe('buildNutritionSummary', () => {
  it('aggregates meals into summary with progress', () => {
    const meals: Meal[] = [
      {
        id: 'm1',
        date: '2026-07-19',
        mealType: 'breakfast',
        foods: [
          {
            id: 'f1',
            foodId: 'food_1',
            name: '鸡蛋',
            weightG: 100,
            calories: 150,
            protein: 12,
            carbs: 1,
            fat: 10,
          },
        ],
        createdAt: '2026-07-19T08:00:00.000Z',
        updatedAt: '2026-07-19T08:00:00.000Z',
      },
    ];
    const targets = { calories: 2000, protein: 150, carbs: 200, fat: 60 };
    const summary = buildNutritionSummary('2026-07-19', meals, targets);
    expect(summary.consumed.calories).toBe(150);
    expect(summary.remaining.calories).toBe(1850);
    expect(summary.progress.calories).toBeCloseTo(0.075);
    expect(summary.meals).toHaveLength(1);
  });

  it('keeps meals from different dates isolated', () => {
    const currentMeal: Meal = {
      id: 'today',
      date: '2026-07-19',
      mealType: 'breakfast',
      foods: [
        {
          id: 'today-food',
          foodId: 'food_1',
          name: '鸡蛋',
          weightG: 100,
          calories: 150,
          protein: 12,
          carbs: 1,
          fat: 10,
        },
      ],
      createdAt: '2026-07-19T08:00:00.000Z',
      updatedAt: '2026-07-19T08:00:00.000Z',
    };
    const previousMeal: Meal = {
      ...currentMeal,
      id: 'yesterday',
      date: '2026-07-18',
      foods: [{ ...currentMeal.foods[0], id: 'yesterday-food', calories: 500 }],
    };

    const summary = buildNutritionSummary(
      '2026-07-19',
      [currentMeal, previousMeal],
      { calories: 2000, protein: 150, carbs: 200, fat: 60 },
    );

    expect(summary.meals).toEqual([currentMeal]);
    expect(summary.consumed.calories).toBe(150);
  });
});

describe('defaultTargets', () => {
  it('uses higher calories and protein for build_muscle', () => {
    const cut = defaultTargets(70, 'lose_fat');
    const bulk = defaultTargets(70, 'build_muscle');
    expect(bulk.calories).toBeGreaterThan(cut.calories);
    expect(bulk.protein).toBeGreaterThan(cut.protein);
    expect(bulk.carbs).toBeGreaterThan(0);
  });
});

describe('overTargetCopy', () => {
  it('describes remaining vs overage without alarmist language', () => {
    expect(overTargetCopy(120)).toContain('还可摄入');
    expect(overTargetCopy(-30)).toContain('已超出');
    expect(overTargetCopy(-30)).toContain('不必焦虑');
  });
});
