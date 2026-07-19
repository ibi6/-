import type { HealthApi } from '@/services/api/interfaces';
import type { BodyMeasurement } from '@/types';
import { createAppError, mockDelay } from '@/services/api/types';
import { buildBodyHistory } from '@/data';
import { readMockData, writeMockData } from './storage';

const MEASUREMENTS_KEY = 'fitai-mock-measurements';

type PersistedMeasurements = {
  initialized: true;
  measurements: BodyMeasurement[];
};

async function loadMeasurements(): Promise<BodyMeasurement[]> {
  const stored = await readMockData<PersistedMeasurements>(MEASUREMENTS_KEY);
  if (stored?.initialized === true && Array.isArray(stored.measurements)) {
    return stored.measurements;
  }
  const measurements = buildBodyHistory();
  await saveMeasurements(measurements);
  return measurements;
}

async function saveMeasurements(measurements: BodyMeasurement[]): Promise<void> {
  await writeMockData<PersistedMeasurements>(MEASUREMENTS_KEY, {
    initialized: true,
    measurements,
  });
}

export const mockHealthApi: HealthApi = {
  async listMeasurements() {
    await mockDelay();
    return (await loadMeasurements()).sort((a, b) => a.date.localeCompare(b.date));
  },

  async addMeasurement(m) {
    await mockDelay();
    const measurements = await loadMeasurements();
    await saveMeasurements([...measurements.filter((item) => item.id !== m.id), m]);
    return m;
  },

  async deleteMeasurement(id) {
    await mockDelay();
    const measurements = await loadMeasurements();
    if (!measurements.some((item) => item.id === id)) {
      throw createAppError('NOT_FOUND', '记录不存在', false);
    }
    await saveMeasurements(measurements.filter((item) => item.id !== id));
  },
};

export async function __resetMeasurements() {
  await saveMeasurements([]);
}
