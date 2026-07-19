import { useNutritionStore } from '@/stores/nutritionStore';
import { useWorkoutStore } from '@/stores/workoutStore';

function persistedSnapshot<T extends object>(store: {
  getState: () => T;
  persist: { getOptions: () => { partialize?: (state: T) => unknown } };
}): Record<string, unknown> {
  const state = store.getState();
  const partialize = store.persist.getOptions().partialize;
  return (partialize ? partialize(state) : state) as Record<string, unknown>;
}

describe('persisted store fields', () => {
  it('keeps the active workout state needed to resume after a restart', () => {
    expect(persistedSnapshot(useWorkoutStore)).toMatchObject({
      activeSession: null,
      phase: 'idle',
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      restSecondsLeft: 0,
    });
  });

  it('keeps date-isolated meal records', () => {
    expect(persistedSnapshot(useNutritionStore)).toHaveProperty('mealsByDate');
  });
});
