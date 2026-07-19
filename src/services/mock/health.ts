import type { HealthApi } from '@/services/api/interfaces';
import type { BodyMeasurement } from '@/types';
import { createAppError, mockDelay } from '@/services/api/types';
import { buildBodyHistory } from '@/data';

const measurements = new Map<string, BodyMeasurement>();

function seed() {
  if (measurements.size === 0) {
    for (const m of buildBodyHistory()) {
      measurements.set(m.id, m);
    }
  }
}

export const mockHealthApi: HealthApi = {
  async listMeasurements() {
    await mockDelay();
    seed();
    return Array.from(measurements.values()).sort((a, b) => a.date.localeCompare(b.date));
  },

  async addMeasurement(m) {
    await mockDelay();
    measurements.set(m.id, m);
    return m;
  },

  async deleteMeasurement(id) {
    await mockDelay();
    if (!measurements.has(id)) {
      throw createAppError('NOT_FOUND', '记录不存在', false);
    }
    measurements.delete(id);
  },
};
