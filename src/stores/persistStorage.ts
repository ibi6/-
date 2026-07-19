import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

/**
 * Prevents a corrupt or unavailable AsyncStorage entry from blocking app startup.
 * Persisted payload contents are never logged because they may contain health data.
 */
export function createSafeJsonStorage(storage: StateStorage): StateStorage {
  return {
    getItem: async (name) => {
      try {
        const value = await storage.getItem(name);
        if (value === null) return null;
        JSON.parse(value);
        return value;
      } catch {
        try {
          await storage.removeItem(name);
        } catch {
          // Storage may be unavailable; hydrate the store with defaults.
        }
        return null;
      }
    },
    setItem: async (name, value) => {
      try {
        await storage.setItem(name, value);
      } catch {
        // Keep the in-memory state usable when persistence is unavailable.
      }
    },
    removeItem: async (name) => {
      try {
        await storage.removeItem(name);
      } catch {
        // Clearing local data is best-effort when the device storage is unavailable.
      }
    },
  };
}

export const safeAsyncStorage = createSafeJsonStorage(AsyncStorage);

export function migratePersistedState<T extends object>(persistedState: unknown): T {
  if (persistedState && typeof persistedState === 'object' && !Array.isArray(persistedState)) {
    return persistedState as T;
  }
  return {} as T;
}
