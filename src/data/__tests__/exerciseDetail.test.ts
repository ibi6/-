import { createExerciseDetailViewModel } from '@/data/exercises';

describe('exercise detail view model', () => {
  it('normalizes an array route parameter and exposes complete Chinese exercise details', () => {
    const detail = createExerciseDetailViewModel([' ex_barbell_bench ', 'ignored'], false);

    expect(detail).toEqual(
      expect.objectContaining({
        id: 'ex_barbell_bench',
        name: '杠铃卧推',
        primaryMuscle: '胸部',
        secondaryMuscles: '肱三头肌、肩部',
        equipment: '杠铃',
        difficulty: '中等 · 3/5',
        description: expect.any(String),
        defaults: {
          sets: '4 组',
          reps: '8 次',
          rest: '2 分钟',
        },
      }),
    );
    expect(detail?.cues.length).toBeGreaterThan(0);
    expect(detail?.commonMistakes.length).toBeGreaterThan(0);
  });

  it.each([undefined, null, '', '   ', [], ['  '], 'unknown'])(
    'returns null for an absent or unknown route id: %p',
    (routeId) => {
      expect(createExerciseDetailViewModel(routeId, false)).toBeNull();
    },
  );

  it('routes the primary action according to whether a workout is active', () => {
    expect(createExerciseDetailViewModel('ex_squat', true)?.primaryAction).toEqual({
      label: '进入当前训练',
      route: '/workout/session',
    });
    expect(createExerciseDetailViewModel('ex_squat', false)?.primaryAction).toEqual({
      label: '返回训练计划',
      route: '/(tabs)/workout',
    });
  });
});
