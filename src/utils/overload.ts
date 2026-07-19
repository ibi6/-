import type { ExerciseSet, Rpe } from '@/types';

export type OverloadSuggestion = {
  nextWeightKg: number;
  nextReps: number;
  reason: string;
};

/**
 * Progressive overload:
 * - all sets hit target reps at RPE ≤ 7 → +2.5kg (compound) / +1kg (isolation-ish)
 * - failed last set or RPE ≥ 9 → keep weight, reduce reps by 1 or keep
 * - pain reported → no increase, suggest deload option (caller handles)
 */
export function suggestNextLoad(params: {
  sets: ExerciseSet[];
  targetReps: number;
  isCompound: boolean;
  painReported?: boolean;
}): OverloadSuggestion {
  const { sets, targetReps, isCompound, painReported } = params;
  const completed = sets.filter((s) => s.completed && !s.skipped);
  if (completed.length === 0) {
    return { nextWeightKg: 0, nextReps: targetReps, reason: '暂无完成组数据' };
  }

  const lastWeight = completed[completed.length - 1]?.weightKg ?? 0;
  const allHitReps = completed.every((s) => s.reps >= targetReps);
  const avgRpe =
    completed.reduce((sum, s) => sum + (s.rpe ?? 7), 0) / completed.length;
  const maxRpe = Math.max(...completed.map((s) => (s.rpe ?? 7) as number)) as Rpe;

  if (painReported) {
    return {
      nextWeightKg: lastWeight,
      nextReps: targetReps,
      reason: '检测到不适反馈，建议维持重量或减量，优先技术与安全',
    };
  }

  if (allHitReps && avgRpe <= 7) {
    const bump = isCompound ? 2.5 : 1;
    return {
      nextWeightKg: Math.round((lastWeight + bump) * 10) / 10,
      nextReps: targetReps,
      reason: `各组达标且 RPE 适中，建议下次 +${bump}kg`,
    };
  }

  if (maxRpe >= 9 || !allHitReps) {
    return {
      nextWeightKg: lastWeight,
      nextReps: Math.max(targetReps - 1, targetReps - 2 > 0 ? targetReps - 1 : targetReps),
      reason: '接近力竭或未满次数，建议维持重量巩固动作',
    };
  }

  return {
    nextWeightKg: lastWeight,
    nextReps: targetReps,
    reason: '表现稳定，维持当前负荷',
  };
}

export function computeSessionVolume(
  exercises: Array<{ sets: ExerciseSet[] }>,
): number {
  return exercises.reduce((total, ex) => {
    return (
      total +
      ex.sets
        .filter((s) => s.completed && !s.skipped)
        .reduce((sum, s) => sum + s.weightKg * s.reps, 0)
    );
  }, 0);
}
