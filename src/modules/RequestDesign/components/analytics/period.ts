import type { BadgeProps } from '@/shared/ui';

import type { AnalyticsPeriod } from '../../types';

/** The month the screen opens on, in the phone's own time zone. */
export function currentPeriod(now: Date = new Date()): AnalyticsPeriod {
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/** The month `delta` months from `period`, across year ends. */
export function shiftPeriod({ month, year }: AnalyticsPeriod, delta: number): AnalyticsPeriod {
  const index = year * 12 + (month - 1) + delta;
  return { month: (index % 12) + 1, year: Math.floor(index / 12) };
}

/** A month in the future has no completed work to show, so the stepper stops at the current one. */
export function isAfter(a: AnalyticsPeriod, b: AnalyticsPeriod): boolean {
  return a.year * 12 + a.month > b.year * 12 + b.month;
}

/** The server accepts years 2000 to 2100. */
export const MIN_YEAR = 2000;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function periodLabel({ month, year }: AnalyticsPeriod): string {
  return `${MONTHS[month - 1] ?? month} ${year}`;
}

/** 42.5 -> "42.5", 42 -> "42", 42.04 -> "42". One decimal at most. */
export function formatPoints(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/** Green once the target is met, blue past half way, amber below. */
export function achievementTone(percent: number): NonNullable<BadgeProps['tone']> {
  if (percent >= 100) return 'success';
  if (percent >= 50) return 'info';
  return 'warning';
}
