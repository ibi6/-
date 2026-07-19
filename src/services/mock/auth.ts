import type { AuthApi } from '@/services/api/interfaces';
import type { AuthUser, UserProfile } from '@/types';
import { createAppError, mockDelay } from '@/services/api/types';
import { todayISO } from '@/utils/date';

let mockUser: UserProfile | null = null;
let mockToken: string | null = null;

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
    if (!mockUser) {
      mockUser = defaultProfile(email, email.split('@')[0] || 'FitAI 用户');
      mockUser.onboardingCompleted = true;
    }
    mockToken = 'mock_token_' + todayISO();
    return {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      token: mockToken,
    } satisfies AuthUser;
  },

  async register(email, password, name) {
    await mockDelay();
    if (!email || !password || !name) {
      throw createAppError('VALIDATION', '请填写完整注册信息', false);
    }
    mockUser = defaultProfile(email, name);
    mockToken = 'mock_token_' + todayISO();
    return {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      token: mockToken,
    };
  },

  async logout() {
    await mockDelay();
    mockToken = null;
  },

  async getProfile() {
    await mockDelay();
    return mockUser;
  },

  async updateProfile(partial) {
    await mockDelay();
    if (!mockUser) {
      throw createAppError('UNAUTHORIZED', '请先登录', false);
    }
    mockUser = {
      ...mockUser,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    return mockUser;
  },
};

export function __resetMockAuth() {
  mockUser = null;
  mockToken = null;
}

export function __setMockUser(user: UserProfile | null) {
  mockUser = user;
}
