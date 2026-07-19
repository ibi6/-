import type { StateStorage } from 'zustand/middleware';
import { createSafeJsonStorage } from '@/stores/persistStorage';

function storageReturning(value: string | null): jest.Mocked<StateStorage> {
  return {
    getItem: jest.fn().mockResolvedValue(value),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  };
}

describe('createSafeJsonStorage', () => {
  it('removes corrupt JSON and hydrates with defaults', async () => {
    const source = storageReturning('{broken-json');
    const storage = createSafeJsonStorage(source);

    await expect(storage.getItem('fitai-user')).resolves.toBeNull();
    expect(source.removeItem).toHaveBeenCalledWith('fitai-user');
  });

  it('returns valid persisted JSON unchanged', async () => {
    const persisted = JSON.stringify({ state: { onboardingDone: true }, version: 1 });
    const source = storageReturning(persisted);
    const storage = createSafeJsonStorage(source);

    await expect(storage.getItem('fitai-user')).resolves.toBe(persisted);
    expect(source.removeItem).not.toHaveBeenCalled();
  });
});
