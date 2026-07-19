import type { BodyMeasurement, Meal, NutritionTargets, PlanDay, WorkoutPlan } from '@/types';
import { addDays, formatDate, generateId, startOfWeek, todayISO } from '@/utils/date';
import { computeMealFoodNutrients } from '@/utils/nutrition';
import { FOODS } from './foods';

function id(prefix: string) {
  return generateId(prefix);
}

export function buildWeeklyPlan(anchorDate = todayISO()): WorkoutPlan {
  const weekStart = startOfWeek(anchorDate);
  const days: PlanDay[] = [
    {
      date: weekStart,
      title: '胸 + 三头',
      focus: '上肢推',
      estimatedMinutes: 45,
      difficulty: 3,
      isRestDay: false,
      exercises: [
        { exerciseId: 'ex_barbell_bench', sets: 4, reps: 8, restSec: 120, targetWeightKg: 40 },
        { exerciseId: 'ex_incline_db', sets: 3, reps: 10, restSec: 90, targetWeightKg: 16 },
        { exerciseId: 'ex_pushdown', sets: 3, reps: 12, restSec: 60, targetWeightKg: 25 },
        { exerciseId: 'ex_plank', sets: 3, reps: 45, restSec: 45 },
      ],
    },
    {
      date: addDays(weekStart, 1),
      title: '背 + 二头',
      focus: '上肢拉',
      estimatedMinutes: 50,
      difficulty: 3,
      isRestDay: false,
      exercises: [
        { exerciseId: 'ex_lat_pulldown', sets: 4, reps: 10, restSec: 90, targetWeightKg: 40 },
        { exerciseId: 'ex_bb_row', sets: 3, reps: 8, restSec: 90, targetWeightKg: 40 },
        { exerciseId: 'ex_seated_row', sets: 3, reps: 10, restSec: 75, targetWeightKg: 35 },
        { exerciseId: 'ex_curl', sets: 3, reps: 12, restSec: 60, targetWeightKg: 10 },
      ],
    },
    {
      date: addDays(weekStart, 2),
      title: '主动恢复',
      focus: '休息 / 轻度活动',
      estimatedMinutes: 20,
      difficulty: 1,
      isRestDay: true,
      exercises: [{ exerciseId: 'ex_plank', sets: 2, reps: 30, restSec: 45 }],
    },
    {
      date: addDays(weekStart, 3),
      title: '下肢日',
      focus: '腿 + 臀',
      estimatedMinutes: 60,
      difficulty: 4,
      isRestDay: false,
      exercises: [
        { exerciseId: 'ex_squat', sets: 4, reps: 6, restSec: 150, targetWeightKg: 50 },
        { exerciseId: 'ex_rdl', sets: 3, reps: 8, restSec: 120, targetWeightKg: 40 },
        { exerciseId: 'ex_leg_press', sets: 3, reps: 12, restSec: 90, targetWeightKg: 80 },
        { exerciseId: 'ex_leg_curl', sets: 3, reps: 12, restSec: 60, targetWeightKg: 25 },
      ],
    },
    {
      date: addDays(weekStart, 4),
      title: '肩 + 核心',
      focus: '肩部与稳定',
      estimatedMinutes: 45,
      difficulty: 3,
      isRestDay: false,
      exercises: [
        { exerciseId: 'ex_ohp', sets: 3, reps: 8, restSec: 90, targetWeightKg: 12 },
        { exerciseId: 'ex_lateral_raise', sets: 3, reps: 12, restSec: 60, targetWeightKg: 6 },
        { exerciseId: 'ex_face_pull', sets: 3, reps: 15, restSec: 60, targetWeightKg: 15 },
        { exerciseId: 'ex_plank', sets: 3, reps: 45, restSec: 45 },
      ],
    },
    {
      date: addDays(weekStart, 5),
      title: '可选有氧 / 全身',
      focus: '可选训练',
      estimatedMinutes: 30,
      difficulty: 2,
      isRestDay: false,
      exercises: [
        { exerciseId: 'ex_pushup', sets: 3, reps: 12, restSec: 60 },
        { exerciseId: 'ex_lunges', sets: 3, reps: 10, restSec: 75, targetWeightKg: 8 },
        { exerciseId: 'ex_hip_thrust', sets: 3, reps: 10, restSec: 90, targetWeightKg: 40 },
      ],
    },
    {
      date: addDays(weekStart, 6),
      title: '休息日',
      focus: '完全休息',
      estimatedMinutes: 0,
      difficulty: 1,
      isRestDay: true,
      exercises: [],
    },
  ];

  return {
    id: `plan_${weekStart}`,
    weekStart,
    days,
  };
}

export const DEFAULT_TARGETS: NutritionTargets = {
  calories: 1800,
  protein: 120,
  carbs: 180,
  fat: 55,
};

function mealFood(
  foodId: string,
  weightG: number,
): {
  id: string;
  foodId: string;
  name: string;
  weightG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const food = FOODS.find((f) => f.id === foodId)!;
  const n = computeMealFoodNutrients(food.per100g, weightG);
  return {
    id: id('mf'),
    foodId,
    name: food.name,
    weightG,
    ...n,
  };
}

export function buildSampleMeals(date: string): Meal[] {
  const now = new Date().toISOString();
  return [
    {
      id: id('meal'),
      date,
      mealType: 'breakfast',
      foods: [
        mealFood('food_oat', 40),
        mealFood('food_milk', 250),
        mealFood('food_banana', 120),
        mealFood('food_egg', 100),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: id('meal'),
      date,
      mealType: 'lunch',
      foods: [
        mealFood('food_chicken', 150),
        mealFood('food_rice', 200),
        mealFood('food_broccoli', 150),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: id('meal'),
      date,
      mealType: 'dinner',
      foods: [
        mealFood('food_salmon', 120),
        mealFood('food_sweet_potato', 200),
        mealFood('food_lettuce', 100),
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/** Multi-date body weight history matching design sample curve + extras */
export function buildBodyHistory(endDate = todayISO()): BodyMeasurement[] {
  const points: Array<{ daysAgo: number; weightKg: number; bodyFatPct?: number }> = [
    { daysAgo: 56, weightKg: 59.3, bodyFatPct: 24.1 },
    { daysAgo: 49, weightKg: 58.7, bodyFatPct: 23.8 },
    { daysAgo: 42, weightKg: 58.1, bodyFatPct: 23.4 },
    { daysAgo: 35, weightKg: 57.3, bodyFatPct: 22.9 },
    { daysAgo: 28, weightKg: 56.8, bodyFatPct: 22.5 },
    { daysAgo: 21, weightKg: 56.5, bodyFatPct: 22.2 },
    { daysAgo: 14, weightKg: 56.2, bodyFatPct: 21.9 },
    { daysAgo: 7, weightKg: 55.9, bodyFatPct: 21.6 },
    { daysAgo: 0, weightKg: 55.6, bodyFatPct: 21.3 },
  ];

  const end = new Date(endDate + 'T12:00:00');
  return points.map((p, i) => {
    const d = new Date(end);
    d.setDate(d.getDate() - p.daysAgo);
    return {
      id: `bm_${i}`,
      date: formatDate(d),
      weightKg: p.weightKg,
      bodyFatPct: p.bodyFatPct,
      waistCm: Math.round((72 - i * 0.4) * 10) / 10,
    };
  });
}

export function buildHistoryMeals(): Meal[] {
  const today = todayISO();
  const meals: Meal[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, -i);
    meals.push(...buildSampleMeals(date));
  }
  return meals;
}
