import { useEffect, useRef } from 'react';
import { useWorkoutStore } from '@/stores';

/** Ticks rest timer once per second while phase is resting. */
export function useSessionTimer() {
  const phase = useWorkoutStore((s) => s.phase);
  const tickRest = useWorkoutStore((s) => s.tickRest);
  const restSecondsLeft = useWorkoutStore((s) => s.restSecondsLeft);
  const ref = useRef(tickRest);
  ref.current = tickRest;

  useEffect(() => {
    if (phase !== 'resting') return;
    const id = setInterval(() => ref.current(), 1000);
    return () => clearInterval(id);
  }, [phase]);

  return { restSecondsLeft, isResting: phase === 'resting' };
}
