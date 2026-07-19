import type { FitAIApi } from '@/services/api/interfaces';
import {
  mockAuthApi,
  mockWorkoutApi,
  mockNutritionApi,
  mockHealthApi,
  mockAIApi,
} from '@/services/mock';

const useMock = process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false';

function createApi(): FitAIApi {
  if (useMock) {
    return {
      auth: mockAuthApi,
      workout: mockWorkoutApi,
      nutrition: mockNutritionApi,
      health: mockHealthApi,
      ai: mockAIApi,
    };
  }

  // Real HTTP client reserved for future backend
  return {
    auth: mockAuthApi,
    workout: mockWorkoutApi,
    nutrition: mockNutritionApi,
    health: mockHealthApi,
    ai: mockAIApi,
  };
}

export const api = createApi();
export type { FitAIApi };
