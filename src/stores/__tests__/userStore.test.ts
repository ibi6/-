jest.mock('@/services/api', () => ({
  api: {
    auth: {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    },
  },
}));

import type { UserProfile } from '@/types';
import { api } from '@/services/api';
import { useUserStore } from '@/stores/userStore';

const profile: UserProfile = {
  id: 'user-1',
  name: '测试用户',
  email: 'test@fitai.app',
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
};

const authApi = api.auth as jest.Mocked<typeof api.auth>;

describe('user store cold-start recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserStore.setState({ profile, onboardingDone: true, isLoading: false });
  });

  it('keeps a persisted profile when the in-memory mock API has restarted', async () => {
    authApi.getProfile.mockResolvedValueOnce(null);

    await useUserStore.getState().loadProfile();

    expect(useUserStore.getState().profile).toEqual(profile);
    expect(useUserStore.getState().onboardingDone).toBe(true);
  });

  it('completes onboarding locally when only the mock backend session was reset', async () => {
    useUserStore.setState({ profile: null, onboardingDone: false, isLoading: false });
    authApi.updateProfile.mockRejectedValueOnce({ code: 'UNAUTHORIZED', message: '请先登录' });

    await useUserStore.getState().completeOnboarding(profile);

    expect(useUserStore.getState().profile).toMatchObject({
      id: 'user-1',
      onboardingCompleted: true,
    });
    expect(useUserStore.getState().onboardingDone).toBe(true);
  });

  it('updates a persisted profile locally when the mock backend session was reset', async () => {
    authApi.updateProfile.mockRejectedValueOnce({ code: 'UNAUTHORIZED', message: '请先登录' });

    await useUserStore.getState().updateProfile({ name: '新昵称' });

    expect(useUserStore.getState().profile?.name).toBe('新昵称');
  });
});
