import { addDays } from './date';

export type AnalyticsRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

const RANGE_DAYS: Record<Exclude<AnalyticsRange, 'all'>, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

export function rangeStartDate(range: AnalyticsRange, today: string): string | null {
  if (range === 'all') return null;
  return addDays(today, -(RANGE_DAYS[range] - 1));
}

export function filterDatedItems<T extends { date: string }>(
  items: T[],
  range: AnalyticsRange,
  today: string,
): T[] {
  const start = rangeStartDate(range, today);
  return items
    .filter((item) => item.date <= today && (start === null || item.date >= start))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function filterByDateRange<T extends { date: string }>(
  items: T[],
  startDate: string,
  endDate?: string,
): T[] {
  return items
    .filter((item) => item.date >= startDate && (endDate === undefined || item.date <= endDate))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function average(values: number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return 0;
  return Math.round((finite.reduce((sum, value) => sum + value, 0) / finite.length) * 10) / 10;
}

export function percentage(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.round((Math.max(0, value) / total) * 1000) / 10;
}

export function trendChange(values: number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length < 2) return 0;
  return Math.round(((finite[finite.length - 1] ?? 0) - (finite[0] ?? 0)) * 10) / 10;
}
