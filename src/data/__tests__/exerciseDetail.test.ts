import {
  createExerciseDetailViewModel,
  createExerciseSegmentState,
  getPlanDayStartAction,
  WORKOUT_DAY_ACTION_MIN_HEIGHT,
} from '@/data/exercises';

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
        safetyNotice:
          '出现尖锐疼痛、肿胀或关节不适时，请立即停止训练，并尽快就医或联系医疗专业人员。',
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

  it('keeps a start entry for every training day including completed days', () => {
    expect(getPlanDayStartAction(false, false)).toEqual({ label: '开始' });
    expect(getPlanDayStartAction(false, true)).toEqual({ label: '再次训练' });
    expect(getPlanDayStartAction(true, false)).toBeNull();
  });

  it('requires workout day actions to expose a 44 point touch target', () => {
    expect(WORKOUT_DAY_ACTION_MIN_HEIGHT).toBe(44);
  });

  it('keeps selected and disabled segment accessibility states independent', () => {
    expect(createExerciseSegmentState(true, false)).toEqual({
      disabled: false,
      accessibilityState: { selected: true, disabled: false },
    });
    expect(createExerciseSegmentState(false, true)).toEqual({
      disabled: true,
      accessibilityState: { selected: false, disabled: true },
    });
  });
});
