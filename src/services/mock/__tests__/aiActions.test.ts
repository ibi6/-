import { mockAIApi } from '@/services/mock/ai';
import { getFoodById } from '@/data';
import type { AIContext, AIResponse } from '@/types';

const context: AIContext = {
  userProfile: {
    id: 'user-1',
    name: '测试用户',
    email: 'test@example.com',
    gender: 'prefer_not_say',
    heightCm: 170,
    weightKg: 65,
    goal: 'keep_fit',
    experience: 'beginner',
    equipment: 'none',
    trainingDaysPerWeek: 3,
    onboardingCompleted: true,
    createdAt: '2026-07-19T00:00:00.000Z',
    updatedAt: '2026-07-19T00:00:00.000Z',
  },
  nutritionSummary: {
    date: '2026-07-19',
    consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    targets: { calories: 1800, protein: 120, carbs: 180, fat: 55 },
    remaining: { calories: 1800, protein: 120, carbs: 180, fat: 55 },
    progress: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    meals: [],
  },
  recentMeasurements: [],
};

async function responseFor(input: string): Promise<AIResponse> {
  const pending = mockAIApi.sendMessage(input, context);
  await jest.runAllTimersAsync();
  return pending;
}

describe('mock AI structured food actions', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('provides executable payloads for every add-food action', async () => {
    const responses = await Promise.all([responseFor('晚餐吃什么'), responseFor('火锅怎么记录')]);
    const actions = responses.flatMap((response) => response.actions ?? []);
    const foodActions = actions.filter((action) => action.type === 'add_food');

    expect(foodActions.length).toBeGreaterThan(0);
    for (const action of foodActions) {
      expect(getFoodById(String(action.payload?.foodId ?? ''))).toBeDefined();
      expect(Number(action.payload?.weightG)).toBeGreaterThan(0);
      expect(['breakfast', 'lunch', 'dinner', 'snack']).toContain(action.payload?.mealType);
    }
  });
});
