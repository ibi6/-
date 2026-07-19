import type { Meal, MealFood, NutritionSummary, NutritionTargets } from '@/types';

export function nutrientForWeight(
  per100g: number,
  weightG: number,
): number {
  return Math.round((per100g * weightG) / 100 * 10) / 10;
}

export function computeMealFoodNutrients(
  per100g: { calories: number; protein: number; carbs: number; fat: number },
  weightG: number,
): Pick<MealFood, 'calories' | 'protein' | 'carbs' | 'fat'> {
  return {
    calories: Math.round(nutrientForWeight(per100g.calories, weightG)),
    protein: nutrientForWeight(per100g.protein, weightG),
    carbs: nutrientForWeight(per100g.carbs, weightG),
    fat: nutrientForWeight(per100g.fat, weightG),
  };
}

export function sumNutrients(
  items: Array<Pick<MealFood, 'calories' | 'protein' | 'carbs' | 'fat'>>,
): NutritionTargets {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: Math.round((acc.protein + item.protein) * 10) / 10,
      carbs: Math.round((acc.carbs + item.carbs) * 10) / 10,
      fat: Math.round((acc.fat + item.fat) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function remainingTargets(
  targets: NutritionTargets,
  consumed: NutritionTargets,
): NutritionTargets {
  return {
    calories: targets.calories - consumed.calories,
    protein: Math.round((targets.protein - consumed.protein) * 10) / 10,
    carbs: Math.round((targets.carbs - consumed.carbs) * 10) / 10,
    fat: Math.round((targets.fat - consumed.fat) * 10) / 10,
  };
}

/** Progress clamped 0–1.2 so UI bars can show slight overage */
export function progressRatio(consumed: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(1.2, Math.max(0, consumed / target));
}

export function buildNutritionSummary(
  date: string,
  meals: Meal[],
  targets: NutritionTargets,
): NutritionSummary {
  const allFoods = meals.flatMap((m) => m.foods);
  const consumed = sumNutrients(allFoods);
  const remaining = remainingTargets(targets, consumed);
  return {
    date,
    consumed,
    targets,
    remaining,
    meals,
    progress: {
      calories: progressRatio(consumed.calories, targets.calories),
      protein: progressRatio(consumed.protein, targets.protein),
      carbs: progressRatio(consumed.carbs, targets.carbs),
      fat: progressRatio(consumed.fat, targets.fat),
    },
  };
}

export function defaultTargets(weightKg: number, goal: string): NutritionTargets {
  const baseCal =
    goal === 'lose_fat' ? weightKg * 28 : goal === 'build_muscle' ? weightKg * 34 : weightKg * 30;
  const calories = Math.round(baseCal);
  const protein = Math.round(weightKg * (goal === 'build_muscle' ? 2.0 : 1.8));
  const fat = Math.round((calories * 0.28) / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  return { calories, protein, carbs, fat };
}

export function overTargetCopy(remaining: number): string {
  if (remaining >= 0) return `还可摄入 ${Math.round(remaining)}`;
  return `已超出 ${Math.round(Math.abs(remaining))}（记录即可，不必焦虑）`;
}
