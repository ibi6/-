import type { ExerciseSet } from '@/types';
import { computeSessionVolume, suggestNextLoad } from '@/utils/overload';

function set(
  partial: Partial<ExerciseSet> & Pick<ExerciseSet, 'id' | 'setIndex' | 'weightKg' | 'reps'>,
): ExerciseSet {
  return {
    completed: true,
    skipped: false,
    ...partial,
  };
}

describe('suggestNextLoad', () => {
  it('returns empty suggestion when no completed sets', () => {
    const result = suggestNextLoad({
      sets: [set({ id: '1', setIndex: 1, weightKg: 60, reps: 8, completed: false })],
      targetReps: 8,
      isCompound: true,
    });
    expect(result.nextWeightKg).toBe(0);
    expect(result.nextReps).toBe(8);
    expect(result.reason).toContain('暂无');
  });

  it('bumps compound weight when all sets hit target with low RPE', () => {
    const sets = [
      set({ id: '1', setIndex: 1, weightKg: 100, reps: 8, rpe: 6 }),
      set({ id: '2', setIndex: 2, weightKg: 100, reps: 8, rpe: 7 }),
      set({ id: '3', setIndex: 3, weightKg: 100, reps: 8, rpe: 7 }),
    ];
    const result = suggestNextLoad({ sets, targetReps: 8, isCompound: true });
    expect(result.nextWeightKg).toBe(102.5);
    expect(result.nextReps).toBe(8);
  });

  it('bumps isolation weight by 1kg under same conditions', () => {
    const sets = [set({ id: '1', setIndex: 1, weightKg: 20, reps: 12, rpe: 6 })];
    const result = suggestNextLoad({ sets, targetReps: 12, isCompound: false });
    expect(result.nextWeightKg).toBe(21);
  });

  it('holds weight and reduces reps when max RPE is high', () => {
    const sets = [
      set({ id: '1', setIndex: 1, weightKg: 80, reps: 8, rpe: 8 }),
      set({ id: '2', setIndex: 2, weightKg: 80, reps: 8, rpe: 9 }),
    ];
    const result = suggestNextLoad({ sets, targetReps: 8, isCompound: true });
    expect(result.nextWeightKg).toBe(80);
    expect(result.nextReps).toBe(7);
  });

  it('holds weight when reps missed', () => {
    const sets = [
      set({ id: '1', setIndex: 1, weightKg: 90, reps: 8, rpe: 7 }),
      set({ id: '2', setIndex: 2, weightKg: 90, reps: 5, rpe: 8 }),
    ];
    const result = suggestNextLoad({ sets, targetReps: 8, isCompound: true });
    expect(result.nextWeightKg).toBe(90);
    expect(result.nextReps).toBe(7);
  });

  it('does not increase when pain is reported', () => {
    const sets = [set({ id: '1', setIndex: 1, weightKg: 100, reps: 8, rpe: 6 })];
    const result = suggestNextLoad({
      sets,
      targetReps: 8,
      isCompound: true,
      painReported: true,
    });
    expect(result.nextWeightKg).toBe(100);
    expect(result.reason).toContain('不适');
  });

  it('never suggests nextReps below 1', () => {
    const sets = [set({ id: '1', setIndex: 1, weightKg: 40, reps: 0, rpe: 10 })];
    const result = suggestNextLoad({ sets, targetReps: 1, isCompound: false });
    expect(result.nextReps).toBe(1);
  });
});

describe('computeSessionVolume', () => {
  it('sums weight × reps for completed non-skipped sets only', () => {
    const volume = computeSessionVolume([
      {
        sets: [
          set({ id: 'a', setIndex: 1, weightKg: 100, reps: 5 }),
          set({ id: 'b', setIndex: 2, weightKg: 100, reps: 5, completed: false }),
          set({ id: 'c', setIndex: 3, weightKg: 50, reps: 10, skipped: true }),
        ],
      },
      {
        sets: [set({ id: 'd', setIndex: 1, weightKg: 20, reps: 10 })],
      },
    ]);
    expect(volume).toBe(100 * 5 + 20 * 10);
  });

  it('returns 0 for empty exercises', () => {
    expect(computeSessionVolume([])).toBe(0);
  });
});
