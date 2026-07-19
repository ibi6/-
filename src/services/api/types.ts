import type { AppError } from '@/types';
import { AppConfig } from '@/constants';
import { randomBetween, sleep } from '@/utils/date';

export async function mockDelay(): Promise<void> {
  const ms = randomBetween(AppConfig.mockApiDelayMs.min, AppConfig.mockApiDelayMs.max);
  await sleep(ms);
}

export function createAppError(
  code: AppError['code'],
  message: string,
  retryable = false,
  details?: unknown,
): AppError {
  return { code, message, retryable, details };
}

export function toError(err: unknown): AppError {
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    return err as AppError;
  }
  return createAppError('UNKNOWN', err instanceof Error ? err.message : '未知错误', true);
}
