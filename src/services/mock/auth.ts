import type { AuthApi } from '@/services/api/interfaces';
import type { AuthUser, UserProfile } from '@/types';
import { createAppError, mockDelay } from '@/services/api/types';
import { todayISO } from '@/utils/date';
import { readMockData, removeMockData, writeMockData } from './storage';

let mockUser: UserProfile | null = null;
let mockToken: string | null = null;
const PROFILE_KEY = 'fitai-mock-profile';
const TOKEN_KEY = 'fitai-mock-token';

async function loadStoredUser(): Promise<UserProfile | null> {
  if (mockUser) return mockUser;
  const stored = await readMockData<UserProfile>(PROFILE_KEY);
  if (!stored || typeof stored !== 'object' || typeof stored.id !== 'string') return null;
  mockUser = stored;
  return mockUser;
}

async function persistUser(user: UserProfile): Promise<void> {
  mockUser = user;
  await writeMockData(PROFILE_KEY, user);
}

function defaultProfile(email: string, name: string): UserProfile {
  const now = new Date().toISOString();
  return {
    id: 'user_demo',
    name,
    email,
    gender: 'female',
    heightCm: 165,
    weightKg: 55.6,
    goal: 'lose_fat',
    experience: 'beginner',
    equipment: 'full_gym',
    trainingDaysPerWeek: 4,
    dietPreference: '均衡饮食',
    injuries: [],
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
}

export const mockAuthApi: AuthApi = {
  async login(email, password) {
    await mockDelay();
    if (!email || !password) {
      throw createAppError('VALIDATION', '请输入邮箱和密码', false);
    }
    const storedUser = await loadStoredUser();
    if (!storedUser || storedUser.email.toLowerCase() !== email.toLowerCase()) {
      const profile = defaultProfile(email, email.split('@')[0] || 'FitAI 用户');
      profile.onboardingCompleted = true;
      await persistUser(profile);
    }
    mockToken = 'mock_token_' + todayISO();
    await writeMockData(TOKEN_KEY, mockToken);
    return {
      id: mockUser!.id,
      email: mockUser!.email,
      name: mockUser!.name,
      token: mockToken,
    } satisfies AuthUser;
  },

  async register(email, password, name) {
    await mockDelay();
    if (!email || !password || !name) {
      throw createAppError('VALIDATION', '请填写完整注册信息', false);
    }
    await persistUser(defaultProfile(email, name));
    mockToken = 'mock_token_' + todayISO();
    await writeMockData(TOKEN_KEY, mockToken);
    return {
      id: mockUser!.id,
      email: mockUser!.email,
      name: mockUser!.name,
      token: mockToken,
    };
  },

  async logout() {
    await mockDelay();
    mockToken = null;
    await removeMockData(TOKEN_KEY);
  },

  async getProfile() {
    await mockDelay();
    return loadStoredUser();
  },

  async updateProfile(partial) {
    await mockDelay();
    const current = await loadStoredUser();
    if (!current) {
      throw createAppError('UNAUTHORIZED', '请先登录', false);
    }
    const updated: UserProfile = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    await persistUser(updated);
    return updated;
  },
};

export function __resetMockAuth() {
  mockUser = null;
  mockToken = null;
}

export function __setMockUser(user: UserProfile | null) {
  mockUser = user;
}
