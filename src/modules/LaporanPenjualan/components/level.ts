import type { BadgeProps } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

import type { AchievementLevel } from '../types';

const LEVELS: Record<string, Pick<BadgeProps, 'label' | 'tone' | 'icon'>> = {
  below: { label: 'Below target', tone: 'warning' },
  near: { label: 'Near target', tone: 'info' },
  achieved: { label: 'Achieved', tone: 'success', icon: 'check' },
};

/** The badge of an achievement level. A level the app does not know shows as the server sent it. */
export function levelBadge(level: AchievementLevel): Pick<BadgeProps, 'label' | 'tone' | 'icon'> {
  return LEVELS[level] ?? { label: sentenceCase(level), tone: 'neutral' };
}

/** 64.6 -> "65%". The server already rounds group and branch figures; the total has decimals. */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** How far from the target, in words: what is left to sell, or how far above it the sales are. */
export function describeBalance(balance: number, formatAmount: (value: number) => string): string {
  return balance < 0 ? `${formatAmount(-balance)} to go` : `${formatAmount(balance)} above target`;
}

/**
 * The share of the monthly target that should be reached by now, if sales were spread evenly
 * over the working days: days with sales over those days plus the days left. A month that has
 * ended expects all of it. `today` is `YYYY-MM`.
 */
export function expectedShare(
  period: string,
  daysDone: number,
  dayLeft: number,
  today: string,
): number | null {
  if (period < today) return 100;
  if (period > today) return null;
  const total = daysDone + Math.max(dayLeft, 0);
  return total > 0 ? Math.min((daysDone / total) * 100, 100) : null;
}

/** The phone's current month as `YYYY-MM`, to compare with a report period. */
export function currentPeriod(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
