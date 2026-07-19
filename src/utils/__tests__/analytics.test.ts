import {
  average,
  filterByDateRange,
  percentage,
  trendChange,
} from '@/utils/analytics';

describe('analytics helpers', () => {
  const rows = [
    { date: '2026-01-01', value: 60 },
    { date: '2026-06-01', value: 58 },
    { date: '2026-07-15', value: 56 },
  ];

  it('filters dated rows inclusively and keeps chronological order', () => {
    expect(filterByDateRange(rows, '2026-06-01')).toEqual([
      { date: '2026-06-01', value: 58 },
      { date: '2026-07-15', value: 56 },
    ]);
  });

  it('returns finite averages and percentages for empty or invalid data', () => {
    expect(average([])).toBe(0);
    expect(average([10, Number.NaN, 20])).toBe(15);
    expect(percentage(1, 0)).toBe(0);
    expect(percentage(3, 4)).toBe(75);
  });

  it('calculates first-to-last trend and handles a single point', () => {
    expect(trendChange(rows.map((row) => row.value))).toBe(-4);
    expect(trendChange([60])).toBe(0);
    expect(trendChange([])).toBe(0);
  });
});
