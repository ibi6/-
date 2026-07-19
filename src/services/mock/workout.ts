import type { WorkoutApi } from '@/services/api/interfaces';
import type { ExerciseSet, WorkoutSession } from '@/types';
import { createAppError, mockDelay } from '@/services/api/types';
import { EXERCISES, getExerciseById, buildWeeklyPlan } from '@/data';
import { generateId, todayISO } from '@/utils/date';
import { computeSessionVolume } from '@/utils/overload';

const sessions = new Map<string, WorkoutSession>();

export const mockWorkoutApi: WorkoutApi = {
  async getWeeklyPlan(date) {
    await mockDelay();
    return buildWeeklyPlan(date);
  },

  async getExercise(id) {
    await mockDelay();
    const ex = getExerciseById(id);
    if (!ex) throw createAppError('NOT_FOUND', '动作不存在', false);
    return ex;
  },

  async listExercises() {
    await mockDelay();
    return EXERCISES;
  },

  async startWorkout(planDayDate) {
    await mockDelay();
    const plan = buildWeeklyPlan(planDayDate);
    const day = plan.days.find((d) => d.date === planDayDate) ?? plan.days[0];
    if (!day) throw createAppError('NOT_FOUND', '未找到训练日', false);

    const session: WorkoutSession = {
      id: generateId('ws'),
      planDayDate: day.date,
      title: day.title,
      startedAt: new Date().toISOString(),
      phase: 'preparing',
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      exercises: day.exercises.map((pe) => {
        const meta = getExerciseById(pe.exerciseId);
        return {
          exerciseId: pe.exerciseId,
          name: meta?.name ?? pe.exerciseId,
          plannedSets: pe.sets,
          plannedReps: pe.reps,
          restSec: pe.restSec,
          sets: Array.from({ length: pe.sets }, (_, i) => ({
            id: generateId('set'),
            setIndex: i + 1,
            weightKg: pe.targetWeightKg ?? 0,
            reps: pe.reps,
            completed: false,
          })),
        };
      }),
    };
    sessions.set(session.id, session);
    return session;
  },

  async saveExerciseSet(sessionId, exerciseId, set: ExerciseSet) {
    await mockDelay();
    const session = sessions.get(sessionId);
    if (!session) throw createAppError('NOT_FOUND', '训练会话不存在', true);
    const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) throw createAppError('NOT_FOUND', '动作不在会话中', false);
    const idx = ex.sets.findIndex((s) => s.id === set.id);
    if (idx >= 0) {
      ex.sets[idx] = set;
    } else {
      ex.sets.push(set);
    }
    sessions.set(sessionId, { ...session });
  },

  async completeWorkout(sessionId) {
    await mockDelay();
    const session = sessions.get(sessionId);
    if (!session) throw createAppError('NOT_FOUND', '训练会话不存在', true);
    const completed: WorkoutSession = {
      ...session,
      phase: 'summary',
      completedAt: new Date().toISOString(),
      totalVolumeKg: computeSessionVolume(session.exercises),
      durationSec: Math.max(
        60,
        Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000),
      ),
    };
    sessions.set(sessionId, completed);
    return completed;
  },

  async getSession(sessionId) {
    await mockDelay();
    return sessions.get(sessionId) ?? null;
  },

  async listSessions() {
    await mockDelay();
    return Array.from(sessions.values()).sort((a, b) =>
      (b.startedAt || '').localeCompare(a.startedAt || ''),
    );
  },
};

export function __getSessionsMap() {
  return sessions;
}

// silence unused in some builds
void todayISO;
