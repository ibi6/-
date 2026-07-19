import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Reads JSON-backed mock data without allowing a damaged cache to crash app startup.
 * Invalid data is removed so the caller can rebuild its domain-specific defaults.
 */
export async function readMockData<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Storage may itself be unavailable; callers still receive a safe fallback.
    }
    return null;
  }
}

/** Writes one mock domain atomically through AsyncStorage's key/value API. */
export async function writeMockData<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/** Removes a mock domain when the user explicitly clears local data. */
export async function removeMockData(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
