import { useCallback, useEffect, useRef, useState } from 'react';

import type { AuthStatus } from '@/core/auth';

import {
  COVERED_AT_MS,
  MIN_PULSE_MS,
  PULSE_CYCLE_MS,
  REDUCED_FADE_MS,
  ZOOM_DURATION_MS,
} from './splash-config';

/** booting: native splash still up. pulsing: waiting on auth. zooming: leaving. done: unmount. */
export type SplashPhase = 'booting' | 'pulsing' | 'zooming' | 'done';

/**
 * Time left until the pulse may stop: at least MIN_PULSE_MS, rounded up to a whole cycle so
 * the symbol is back at rest scale when the zoom starts.
 */
export function pulseWaitMs(elapsedMs: number): number {
  const target = Math.ceil(Math.max(elapsedMs, MIN_PULSE_MS) / PULSE_CYCLE_MS) * PULSE_CYCLE_MS;
  return target - elapsedMs;
}

/**
 * State machine of the animated splash: booting -> pulsing -> zooming -> done.
 * It only decides when each phase starts; the overlay animates whatever phase it is given.
 * Every timer is cleared on unmount or when its inputs change.
 */
export function useSplashSequence(authStatus: AuthStatus, reduceMotion: boolean) {
  const [phase, setPhase] = useState<SplashPhase>('booting');
  const [covered, setCovered] = useState(false);
  const pulseStartedAt = useRef<number | null>(null);
  const known = authStatus !== 'restoring';

  /** Call once the overlay has laid out. Later calls (rotation, resize) are ignored. */
  const start = useCallback(() => {
    if (pulseStartedAt.current !== null) return;
    pulseStartedAt.current = Date.now();
    setPhase('pulsing');
  }, []);

  // The auth status may be known before the first layout; this runs once both are true.
  useEffect(() => {
    if (phase !== 'pulsing' || !known) return;
    const elapsed = Date.now() - (pulseStartedAt.current ?? Date.now());
    const timer = setTimeout(() => setPhase('zooming'), reduceMotion ? 0 : pulseWaitMs(elapsed));
    return () => clearTimeout(timer);
  }, [phase, known, reduceMotion]);

  useEffect(() => {
    if (phase !== 'zooming') return;
    const duration = reduceMotion ? REDUCED_FADE_MS : ZOOM_DURATION_MS;
    const coverTimer = setTimeout(() => setCovered(true), reduceMotion ? 0 : COVERED_AT_MS);
    const doneTimer = setTimeout(() => setPhase('done'), duration);
    return () => {
      clearTimeout(coverTimer);
      clearTimeout(doneTimer);
    };
  }, [phase, reduceMotion]);

  return { phase, covered, start };
}
