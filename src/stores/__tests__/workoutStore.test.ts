jest.mock('@/services/api', () => ({
  api: {
    workout: {
      saveExerciseSet: jest.fn(),
    },
    ai: {
      adjustWorkout: jest.fn(),
    },
  },
}));

import type { WorkoutSession } from '@/types';
import { api } from '@/services/api';
import { useWorkoutStore } from '@/stores/workoutStore';

const session: WorkoutSession = {
  id: 'session-1',
  planDayDate: '2026-07-19',
  title: '上肢训练',
  startedAt: '2026-07-19T08:00:00.000Z',
  phase: 'activeSet',
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  exercises: [
    {
      exerciseId: 'bench-press',
      name: '卧推',
      plannedSets: 2,
      plannedReps: 8,
      restSec: 60,
      sets: [
        { id: 'set-1', setIndex: 1, weightKg: 40, reps: 8, completed: false },
        { id: 'set-2', setIndex: 2, weightKg: 40, reps: 8, completed: false },
      ],
    },
  ],
};

const workoutApi = api.workout as jest.Mocked<typeof api.workout>;
const aiApi = api.ai as jest.Mocked<typeof api.ai>;

describe('workout store set logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    workoutApi.saveExerciseSet.mockResolvedValue(undefined);
    useWorkoutStore.setState({
      activeSession: session,
      phase: 'activeSet',
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      restSecondsLeft: 0,
      error: null,
    });
  });

  it('rejects negative weight and non-positive reps before saving', async () => {
    await expect(useWorkoutStore.getState().logSet({ weightKg: -1, reps: 0 })).rejects.toThrow(
      '训练数据无效',
    );
    expect(workoutApi.saveExerciseSet).not.toHaveBeenCalled();
  });

  it('prevents two rapid submissions of the same set', async () => {
    let release: (() => void) | undefined;
    workoutApi.saveExerciseSet.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );

    const first = useWorkoutStore.getState().logSet({ weightKg: 40, reps: 8 });
    const second = useWorkoutStore.getState().logSet({ weightKg: 40, reps: 8 });
    await Promise.resolve();

    expect(workoutApi.saveExerciseSet).toHaveBeenCalledTimes(1);
    release?.();
    await Promise.all([first, second]);
  });

  it('keeps the persisted session phase in sync when rest is skipped', () => {
    useWorkoutStore.setState({
      activeSession: { ...session, phase: 'resting' },
      phase: 'resting',
      restSecondsLeft: 30,
    });

    useWorkoutStore.getState().skipRest();

    expect(useWorkoutStore.getState()).toMatchObject({
      phase: 'activeSet',
      restSecondsLeft: 0,
      activeSession: { phase: 'activeSet' },
    });
  });

  it('records an absolute rest end time so a restarted app can reconcile the countdown', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-19T08:00:00.000Z'));
    try {
      await useWorkoutStore.getState().logSet({ weightKg: 40, reps: 8 });
      expect(useWorkoutStore.getState().activeSession?.restEndsAt).toBe(
        '2026-07-19T08:01:00.000Z',
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('ends an expired persisted rest period immediately after restart', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-19T08:02:00.000Z'));
    try {
      useWorkoutStore.setState({
        activeSession: {
          ...session,
          phase: 'resting',
          restEndsAt: '2026-07-19T08:01:00.000Z',
        },
        phase: 'resting',
        restSecondsLeft: 30,
      });

      useWorkoutStore.getState().tickRest();

      expect(useWorkoutStore.getState()).toMatchObject({
        phase: 'activeSet',
        restSecondsLeft: 0,
        activeSession: { phase: 'activeSet' },
      });
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('workout plan adjustment', () => {
  const originalPlan = { id: 'plan-old', weekStart: '2026-07-13', days: [] };
  const adjustedPlan = { id: 'plan-new', weekStart: '2026-07-13', days: [] };

  beforeEach(() => {
    jest.clearAllMocks();
    useWorkoutStore.setState({ weeklyPlan: originalPlan, isLoading: false, error: null });
  });

  it('replaces the weekly plan after the AI adjustment succeeds', async () => {
    const adjustPlan = (
      useWorkoutStore.getState() as typeof useWorkoutStore extends never
        ? never
        : { adjustPlan?: (request: { reason: string }) => Promise<void> }
    ).adjustPlan;
    expect(typeof adjustPlan).toBe('function');
    if (!adjustPlan) return;
    aiApi.adjustWorkout.mockResolvedValueOnce(adjustedPlan);

    await adjustPlan({ reason: '本周降低训练量' });

    expect(aiApi.adjustWorkout).toHaveBeenCalledWith({ reason: '本周降低训练量' });
    expect(useWorkoutStore.getState()).toMatchObject({
      weeklyPlan: adjustedPlan,
      isLoading: false,
      error: null,
    });
  });

  it('keeps the current plan and exposes a Chinese error when adjustment fails', async () => {
    const adjustPlan = (
      useWorkoutStore.getState() as unknown as {
        adjustPlan?: (request: { reason: string }) => Promise<void>;
      }
    ).adjustPlan;
    expect(typeof adjustPlan).toBe('function');
    if (!adjustPlan) return;
    aiApi.adjustWorkout.mockRejectedValueOnce(new Error('服务暂时不可用'));

    await expect(adjustPlan({ reason: '减少训练量' })).rejects.toThrow('服务暂时不可用');

    expect(useWorkoutStore.getState().weeklyPlan).toBe(originalPlan);
    expect(useWorkoutStore.getState()).toMatchObject({
      isLoading: false,
      error: '服务暂时不可用',
    });
  });
});
