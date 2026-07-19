import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ExerciseSet,
  PlanDay,
  Rpe,
  WorkoutPhase,
  WorkoutPlan,
  WorkoutAdjustmentRequest,
  WorkoutSession,
} from '@/types';
import { api } from '@/services/api';
import { AppConfig } from '@/constants';
import { generateId, todayISO } from '@/utils/date';
import { suggestNextLoad } from '@/utils/overload';
import { getExerciseById } from '@/data';
import { migratePersistedState, safeAsyncStorage } from './persistStorage';

type WorkoutState = {
  weeklyPlan: WorkoutPlan | null;
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  phase: WorkoutPhase;
  currentExerciseIndex: number;
  currentSetIndex: number;
  restSecondsLeft: number;
  isLoading: boolean;
  isSavingSet: boolean;
  isAdjustingPlan: boolean;
  error: string | null;

  loadWeeklyPlan: () => Promise<void>;
  loadSessions: () => Promise<void>;
  startTodayWorkout: () => Promise<void>;
  startPlanDay: (day: PlanDay) => Promise<void>;
  setPhase: (phase: WorkoutPhase) => void;
  logSet: (payload: {
    weightKg: number;
    reps: number;
    rpe?: Rpe;
    painFlag?: boolean;
  }) => Promise<void>;
  skipRest: () => void;
  tickRest: () => void;
  completeWorkout: () => Promise<WorkoutSession | null>;
  abandonWorkout: () => void;
  applyPlan: (plan: WorkoutPlan) => void;
  adjustPlan: (request: WorkoutAdjustmentRequest) => Promise<void>;
  getTodayPlanDay: () => PlanDay | null;
};

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      weeklyPlan: null,
      sessions: [],
      activeSession: null,
      phase: 'idle',
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      restSecondsLeft: 0,
      isLoading: false,
      isSavingSet: false,
      isAdjustingPlan: false,
      error: null,

      getTodayPlanDay: () => {
        const plan = get().weeklyPlan;
        if (!plan) return null;
        const today = todayISO();
        return plan.days.find((d) => d.date === today) ?? null;
      },

      loadWeeklyPlan: async () => {
        set({ isLoading: true, error: null });
        try {
          const weeklyPlan = await api.workout.getWeeklyPlan(todayISO());
          set({ weeklyPlan, isLoading: false });
        } catch (e) {
          set({
            isLoading: false,
            error:
              e && typeof e === 'object' && 'message' in e
                ? String((e as { message: string }).message)
                : '加载计划失败',
          });
        }
      },

      loadSessions: async () => {
        try {
          const sessions = await api.workout.listSessions();
          set({ sessions });
        } catch {
          /* ignore */
        }
      },

      startTodayWorkout: async () => {
        const day = get().getTodayPlanDay();
        if (!day || day.isRestDay) {
          const message = '今天是休息日，或暂无训练安排';
          set({ error: message });
          throw new Error(message);
        }
        await get().startPlanDay(day);
      },

      startPlanDay: async (day) => {
        if (day.isRestDay) {
          const message = '该日为休息日，无法开始训练';
          set({ error: message });
          throw new Error(message);
        }
        set({ isLoading: true, error: null });
        try {
          const session = await api.workout.startWorkout(day.date);
          set({
            activeSession: session,
            phase: 'preparing',
            currentExerciseIndex: 0,
            currentSetIndex: 0,
            restSecondsLeft: 0,
            isLoading: false,
          });
        } catch (e) {
          const message =
            e && typeof e === 'object' && 'message' in e
              ? String((e as { message: string }).message)
              : '无法开始训练';
          set({
            isLoading: false,
            error: message,
          });
          throw e instanceof Error ? e : new Error(message);
        }
      },

      setPhase: (phase) =>
        set((state) => ({
          phase,
          activeSession: state.activeSession ? { ...state.activeSession, phase } : null,
        })),

      logSet: async ({ weightKg, reps, rpe, painFlag }) => {
        if (get().isSavingSet) return;
        if (
          !Number.isFinite(weightKg) ||
          weightKg < 0 ||
          weightKg > 1000 ||
          !Number.isFinite(reps) ||
          reps <= 0 ||
          reps > 1000 ||
          (rpe !== undefined && (rpe < 1 || rpe > 10))
        ) {
          const message = '训练数据无效：请检查重量、次数和 RPE';
          set({ error: message });
          throw new Error(message);
        }
        const { activeSession, currentExerciseIndex, currentSetIndex } = get();
        if (!activeSession) {
          const message = '没有可记录的训练会话';
          set({ error: message });
          throw new Error(message);
        }

        const ex = activeSession.exercises[currentExerciseIndex];
        const existing = ex?.sets[currentSetIndex];
        if (!ex || !existing) {
          const message = '训练组索引无效，请重新进入训练';
          set({ error: message });
          throw new Error(message);
        }

        const setLog: ExerciseSet = {
          id: existing.id ?? generateId('set'),
          setIndex: existing.setIndex ?? currentSetIndex + 1,
          weightKg,
          reps: Math.round(reps),
          rpe,
          completed: true,
          completedAt: new Date().toISOString(),
        };

        set({ isSavingSet: true, error: null });
        try {
          await api.workout.saveExerciseSet(activeSession.id, ex.exerciseId, setLog);

          const nextExercises = activeSession.exercises.map((item, i) => {
            if (i !== currentExerciseIndex) return item;
            const sets = item.sets.map((s, si) => (si === currentSetIndex ? setLog : s));
            return {
              ...item,
              painReported: painFlag ? true : item.painReported,
              sets,
            };
          });

          const updated: WorkoutSession = {
            ...activeSession,
            exercises: nextExercises,
            phase: 'activeSet',
            currentExerciseIndex,
            currentSetIndex,
          };

          const nextSetIndex = currentSetIndex + 1;
          const plannedSets = ex.plannedSets;
          const isLastSet = nextSetIndex >= plannedSets;
          const isLastExercise = currentExerciseIndex >= updated.exercises.length - 1;

          if (isLastSet && isLastExercise) {
            set({
              activeSession: { ...updated, phase: 'completed' },
              phase: 'completed',
              currentSetIndex: nextSetIndex,
              restSecondsLeft: 0,
            });
            return;
          }

          if (isLastSet) {
            const nextEx = updated.exercises[currentExerciseIndex + 1];
            const rest = nextEx?.restSec ?? AppConfig.restTimerDefaultSec;
            const restEndsAt = new Date(Date.now() + rest * 1000).toISOString();
            set({
              activeSession: {
                ...updated,
                currentExerciseIndex: currentExerciseIndex + 1,
                currentSetIndex: 0,
                phase: 'resting',
                restEndsAt,
              },
              phase: 'resting',
              currentExerciseIndex: currentExerciseIndex + 1,
              currentSetIndex: 0,
              restSecondsLeft: rest,
            });
          } else {
            const rest = ex.restSec ?? AppConfig.restTimerDefaultSec;
            const restEndsAt = new Date(Date.now() + rest * 1000).toISOString();
            set({
              activeSession: {
                ...updated,
                currentSetIndex: nextSetIndex,
                phase: 'resting',
                restEndsAt,
              },
              phase: 'resting',
              currentSetIndex: nextSetIndex,
              restSecondsLeft: rest,
            });
          }
        } catch (error) {
          const message =
            error && typeof error === 'object' && 'message' in error
              ? String((error as { message: string }).message)
              : '训练记录保存失败';
          set({ error: message });
          throw error instanceof Error ? error : new Error(message);
        } finally {
          set({ isSavingSet: false });
        }
      },

      skipRest: () => {
        if (get().phase !== 'resting') return;
        set((state) => ({
          restSecondsLeft: 0,
          phase: 'activeSet',
          activeSession: state.activeSession
            ? { ...state.activeSession, phase: 'activeSet', restEndsAt: undefined }
            : null,
        }));
      },

      tickRest: () => {
        const { activeSession, restSecondsLeft, phase } = get();
        if (phase !== 'resting') return;
        const restEndMs = activeSession?.restEndsAt
          ? Date.parse(activeSession.restEndsAt)
          : Number.NaN;
        const reconciledSeconds = Number.isFinite(restEndMs)
          ? Math.max(0, Math.ceil((restEndMs - Date.now()) / 1000))
          : Math.max(0, restSecondsLeft - 1);
        if (reconciledSeconds <= 0) {
          set((state) => ({
            restSecondsLeft: 0,
            phase: 'activeSet',
            activeSession: state.activeSession
              ? { ...state.activeSession, phase: 'activeSet', restEndsAt: undefined }
              : null,
          }));
        } else {
          set({ restSecondsLeft: reconciledSeconds });
        }
      },

      completeWorkout: async () => {
        const { activeSession } = get();
        if (!activeSession) return null;
        const done = await api.workout.completeWorkout(activeSession.id);
        set((s) => ({
          activeSession: null,
          phase: 'summary',
          sessions: [done, ...s.sessions.filter((x) => x.id !== done.id)],
        }));
        return done;
      },

      abandonWorkout: () => {
        set({
          activeSession: null,
          phase: 'idle',
          currentExerciseIndex: 0,
          currentSetIndex: 0,
          restSecondsLeft: 0,
        });
      },

      applyPlan: (plan) => set({ weeklyPlan: plan }),

      adjustPlan: async (request) => {
        if (get().isAdjustingPlan) return;
        set({ isAdjustingPlan: true, error: null });
        try {
          const weeklyPlan = await api.ai.adjustWorkout(request);
          set({ weeklyPlan, isAdjustingPlan: false, error: null });
        } catch (error) {
          const message =
            error && typeof error === 'object' && 'message' in error
              ? String((error as { message: string }).message)
              : '计划调整失败，请稍后重试';
          set({ isAdjustingPlan: false, error: message });
          throw error instanceof Error ? error : new Error(message);
        }
      },
    }),
    {
      name: 'fitai-workout',
      version: AppConfig.storeVersion,
      storage: createJSONStorage(() => safeAsyncStorage),
      migrate: (persistedState) => migratePersistedState<WorkoutState>(persistedState),
      partialize: (s) => ({
        weeklyPlan: s.weeklyPlan,
        sessions: s.sessions,
        activeSession: s.activeSession,
        phase: s.phase,
        currentExerciseIndex: s.currentExerciseIndex,
        currentSetIndex: s.currentSetIndex,
        restSecondsLeft: s.restSecondsLeft,
      }),
    },
  ),
);

export function getSuggestedLoad(session: WorkoutSession | null, exerciseIndex: number) {
  if (!session) return null;
  const ex = session.exercises[exerciseIndex];
  if (!ex) return null;
  const meta = getExerciseById(ex.exerciseId);
  return suggestNextLoad({
    sets: ex.sets,
    targetReps: ex.plannedReps,
    isCompound: meta?.isCompound ?? true,
    painReported: ex.painReported,
  });
}
