import type { WorkoutApi } from '@/services/api/interfaces';
import type { ExerciseSet, WorkoutSession } from '@/types';
import { createAppError, mockDelay } from '@/services/api/types';
import { EXERCISES, getExerciseById, buildWeeklyPlan } from '@/data';
import { generateId, todayISO } from '@/utils/date';
import { computeSessionVolume } from '@/utils/overload';
import { readMockData, writeMockData } from './storage';

const SESSIONS_KEY = 'fitai-mock-workout-sessions';

async function loadSessions(): Promise<WorkoutSession[]> {
  const stored = await readMockData<WorkoutSession[]>(SESSIONS_KEY);
  return Array.isArray(stored) ? stored : [];
}

async function saveSessions(sessions: WorkoutSession[]): Promise<void> {
  await writeMockData(SESSIONS_KEY, sessions);
}

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
    const sessions = await loadSessions();
    await saveSessions([session, ...sessions.filter((item) => item.id !== session.id)]);
    return session;
  },

  async saveExerciseSet(sessionId, exerciseId, set: ExerciseSet) {
    await mockDelay();
    const sessions = await loadSessions();
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) throw createAppError('NOT_FOUND', '训练会话不存在', true);
    if (!session.exercises.some((item) => item.exerciseId === exerciseId)) {
      throw createAppError('NOT_FOUND', '动作不在会话中', false);
    }
    const updated: WorkoutSession = {
      ...session,
      exercises: session.exercises.map((exercise) => {
        if (exercise.exerciseId !== exerciseId) return exercise;
        const exists = exercise.sets.some((item) => item.id === set.id);
        return {
          ...exercise,
          sets: exists
            ? exercise.sets.map((item) => (item.id === set.id ? set : item))
            : [...exercise.sets, set],
        };
      }),
    };
    await saveSessions(sessions.map((item) => (item.id === updated.id ? updated : item)));
  },

  async completeWorkout(sessionId) {
    await mockDelay();
    const sessions = await loadSessions();
    const session = sessions.find((item) => item.id === sessionId);
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
    await saveSessions(sessions.map((item) => (item.id === completed.id ? completed : item)));
    return completed;
  },

  async getSession(sessionId) {
    await mockDelay();
    return (await loadSessions()).find((item) => item.id === sessionId) ?? null;
  },

  async listSessions() {
    await mockDelay();
    return (await loadSessions()).sort((a, b) =>
      (b.startedAt || '').localeCompare(a.startedAt || ''),
    );
  },
};

export async function __resetSessions() {
  await saveSessions([]);
}

// silence unused in some builds
void todayISO;
