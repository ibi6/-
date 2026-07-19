import { useMemo } from 'react';
import { todayISO, weekdayLabel } from '@/utils/date';

export function useToday() {
  return useMemo(() => {
    const date = todayISO();
    return { date, weekday: weekdayLabel(date) };
  }, []);
}
