import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ExerciseSet,
  PlanDay,
  Rpe,
  WorkoutPhase,
  WorkoutPlan,
  WorkoutSession,
} from '@/types';
import { api } from '@/services/api';
import { AppConfig } from '@/constants';
import { generateId, todayISO } from '@/utils/date';
import { suggestNextLoad } from '@/utils/overload';
import { getExerciseById } from '@/data';

type WorkoutState = {
  weeklyPlan: WorkoutPlan | null;
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  phase: WorkoutPhase;
  currentExerciseIndex: number;
  currentSetIndex: number;
  restSecondsLeft: number;
  isLoading: boolean;
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
          set({ error: '今天是休息日，或暂无训练安排' });
          return;
        }
        await get().startPlanDay(day);
      },

      startPlanDay: async (day) => {
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
          set({
            isLoading: false,
            error:
              e && typeof e === 'object' && 'message' in e
                ? String((e as { message: string }).message)
                : '无法开始训练',
          });
        }
      },

      setPhase: (phase) => set({ phase }),

      logSet: async ({ weightKg, reps, rpe, painFlag }) => {
        const { activeSession, currentExerciseIndex, currentSetIndex } = get();
        if (!activeSession) return;

        const ex = activeSession.exercises[currentExerciseIndex];
        if (!ex) return;

        const existing = ex.sets[currentSetIndex];
        const setLog: ExerciseSet = {
          id: existing?.id ?? generateId('set'),
          setIndex: existing?.setIndex ?? currentSetIndex + 1,
          weightKg,
          reps,
          rpe,
          completed: true,
          completedAt: new Date().toISOString(),
        };

        if (painFlag) {
          ex.painReported = true;
        }

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
          set({
            activeSession: {
              ...updated,
              currentExerciseIndex: currentExerciseIndex + 1,
              currentSetIndex: 0,
              phase: 'resting',
            },
            phase: 'resting',
            currentExerciseIndex: currentExerciseIndex + 1,
            currentSetIndex: 0,
            restSecondsLeft: rest,
          });
        } else {
          const rest = ex.restSec ?? AppConfig.restTimerDefaultSec;
          set({
            activeSession: {
              ...updated,
              currentSetIndex: nextSetIndex,
              phase: 'resting',
            },
            phase: 'resting',
            currentSetIndex: nextSetIndex,
            restSecondsLeft: rest,
          });
        }
      },

      skipRest: () => {
        if (get().phase !== 'resting') return;
        set({ restSecondsLeft: 0, phase: 'activeSet' });
      },

      tickRest: () => {
        const { restSecondsLeft, phase } = get();
        if (phase !== 'resting') return;
        if (restSecondsLeft <= 1) {
          set({ restSecondsLeft: 0, phase: 'activeSet' });
        } else {
          set({ restSecondsLeft: restSecondsLeft - 1 });
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
    }),
    {
      name: 'fitai-workout',
      version: AppConfig.storeVersion,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        weeklyPlan: s.weeklyPlan,
        sessions: s.sessions,
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
