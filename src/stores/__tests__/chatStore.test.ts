jest.mock('@/services/api', () => ({
  api: {
    ai: {
      sendMessage: jest.fn(),
      recognizeFood: jest.fn(),
    },
  },
}));

import { api } from '@/services/api';
import { useChatStore } from '@/stores/chatStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { AppConfig } from '@/constants';

const aiApi = api.ai as jest.Mocked<typeof api.ai>;

describe('chat store request safety', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useChatStore.setState({
      messages: [],
      isThinking: false,
      dailyAiCount: 0,
      dailyAiDate: '2026-07-19',
      error: null,
    });
    useSubscriptionStore.setState({ plan: 'free', isActive: false, trialUsed: false });
  });

  it('prevents rapid duplicate sends while a response is pending', async () => {
    let release: (() => void) | undefined;
    aiApi.sendMessage.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              id: 'response-1',
              text: '收到',
              category: 'general',
            });
        }),
    );

    const first = useChatStore.getState().send('如何安排训练？');
    const second = useChatStore.getState().send('如何安排训练？');
    await Promise.resolve();

    expect(aiApi.sendMessage).toHaveBeenCalledTimes(1);
    release?.();
    await Promise.all([first, second]);
  });

  it('does not consume the daily quota when the AI request fails', async () => {
    aiApi.sendMessage.mockRejectedValueOnce(new Error('网络失败'));

    await useChatStore.getState().send('今天吃什么？');

    expect(useChatStore.getState().dailyAiCount).toBe(0);
    expect(useChatStore.getState()).toMatchObject({
      isThinking: false,
      error: '网络失败',
    });
  });

  it('allows active Pro users after the free quota is exhausted without incrementing it', async () => {
    useSubscriptionStore.setState({ plan: 'pro_monthly', isActive: true, trialUsed: true });
    useChatStore.setState({ dailyAiCount: AppConfig.freeAiMessagesPerDay });
    aiApi.sendMessage.mockResolvedValueOnce({
      id: 'response-pro',
      text: 'Pro 回复',
      category: 'general',
    });

    await useChatStore.getState().send('继续给我建议');

    expect(aiApi.sendMessage).toHaveBeenCalledTimes(1);
    expect(useChatStore.getState().dailyAiCount).toBe(AppConfig.freeAiMessagesPerDay);
  });

  it('does not call the AI API when a free user has exhausted the quota', async () => {
    useChatStore.setState({ dailyAiCount: AppConfig.freeAiMessagesPerDay });

    await useChatStore.getState().send('继续给我建议');

    expect(aiApi.sendMessage).not.toHaveBeenCalled();
    expect(useChatStore.getState().error).toContain('今日免费 AI 次数已用完');
  });
});
