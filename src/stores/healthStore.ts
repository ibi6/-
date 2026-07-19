import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BodyMeasurement } from '@/types';
import { api } from '@/services/api';
import { AppConfig } from '@/constants';
import { generateId, todayISO } from '@/utils/date';

type HealthState = {
  measurements: BodyMeasurement[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  add: (payload: Omit<BodyMeasurement, 'id'> & { id?: string }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  latest: () => BodyMeasurement | null;
};

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      measurements: [],
      isLoading: false,
      error: null,

      load: async () => {
        set({ isLoading: true, error: null });
        try {
          const measurements = await api.health.listMeasurements();
          set({ measurements, isLoading: false });
        } catch (e) {
          set({
            isLoading: false,
            error:
              e && typeof e === 'object' && 'message' in e
                ? String((e as { message: string }).message)
                : '加载身体数据失败',
          });
        }
      },

      add: async (payload) => {
        const m: BodyMeasurement = {
          id: payload.id ?? generateId('body'),
          date: payload.date || todayISO(),
          weightKg: payload.weightKg,
          bodyFatPct: payload.bodyFatPct,
          chestCm: payload.chestCm,
          waistCm: payload.waistCm,
          hipCm: payload.hipCm,
          armCm: payload.armCm,
          thighCm: payload.thighCm,
          note: payload.note,
        };
        const saved = await api.health.addMeasurement(m);
        set((s) => ({
          measurements: [...s.measurements.filter((x) => x.id !== saved.id), saved].sort((a, b) =>
            a.date.localeCompare(b.date),
          ),
        }));
      },

      remove: async (id) => {
        await api.health.deleteMeasurement(id);
        set((s) => ({ measurements: s.measurements.filter((m) => m.id !== id) }));
      },

      latest: () => {
        const list = get().measurements;
        if (!list.length) return null;
        return list[list.length - 1] ?? null;
      },
    }),
    {
      name: 'fitai-health',
      version: AppConfig.storeVersion,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ measurements: s.measurements }),
    },
  ),
);
