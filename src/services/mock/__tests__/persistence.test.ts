import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BodyMeasurement, Meal } from '@/types';

jest.mock('@/services/api/types', () => ({
  mockDelay: jest.fn(async () => undefined),
  createAppError: (
    code: string,
    message: string,
    retryable = false,
    details?: unknown,
  ) => ({ code, message, retryable, details }),
}));

describe('Mock service persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('restores the registered profile after the service module reloads', async () => {
    const first = jest.requireActual<typeof import('@/services/mock/auth')>(
      '@/services/mock/auth',
    );
    await first.mockAuthApi.register('tester@fitai.app', 'secret123', '测试用户');

    first.__resetMockAuth();
    const profile = await first.mockAuthApi.getProfile();

    expect(profile).toMatchObject({
      email: 'tester@fitai.app',
      name: '测试用户',
      onboardingCompleted: false,
    });
  });

  it('restores meals after the nutrition service module reloads', async () => {
    const meal: Meal = {
      id: 'meal_persisted',
      date: '2030-01-02',
      mealType: 'breakfast',
      foods: [
        {
          id: 'food_entry',
          foodId: 'food_egg',
          name: '鸡蛋',
          weightG: 100,
          calories: 155,
          protein: 13,
          carbs: 1.1,
          fat: 11,
        },
      ],
      createdAt: '2030-01-02T08:00:00.000Z',
      updatedAt: '2030-01-02T08:00:00.000Z',
    };
    const first = jest.requireActual<typeof import('@/services/mock/nutrition')>(
      '@/services/mock/nutrition',
    );
    await first.mockNutritionApi.addMeal(meal);

    const summary = await first.mockNutritionApi.getDailySummary(meal.date);

    expect(summary.meals).toEqual([meal]);
  });

  it('restores an active workout session after the service module reloads', async () => {
    const first = jest.requireActual<typeof import('@/services/mock/workout')>(
      '@/services/mock/workout',
    );
    const plan = await first.mockWorkoutApi.getWeeklyPlan('2030-01-07');
    const trainingDay = plan.days.find((day) => !day.isRestDay);
    expect(trainingDay).toBeDefined();
    const session = await first.mockWorkoutApi.startWorkout(trainingDay!.date);

    const restored = await first.mockWorkoutApi.getSession(session.id);

    expect(restored).toEqual(session);
  });

  it('restores body measurements after the health service module reloads', async () => {
    const measurement: BodyMeasurement = {
      id: 'body_persisted',
      date: '2030-01-02',
      weightKg: 66.5,
      bodyFatPct: 20,
    };
    const first = jest.requireActual<typeof import('@/services/mock/health')>(
      '@/services/mock/health',
    );
    await first.mockHealthApi.addMeasurement(measurement);

    const restored = await first.mockHealthApi.listMeasurements();

    expect(restored).toContainEqual(measurement);
  });
});
