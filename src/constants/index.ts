export { Colors } from './colors';
export { Spacing, Radius, Shadows } from './spacing';
export { Typography } from './typography';

export const AppConfig = {
  name: 'FitAI',
  mockApiDelayMs: { min: 400, max: 900 },
  aiThinkingMs: { min: 600, max: 1200 },
  restTimerDefaultSec: 90,
  freeAiMessagesPerDay: 10,
  storeVersion: 1,
} as const;
