import type { BadgeProps } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

import type { AchievementLevel } from '../types';

const LEVELS: Record<string, Pick<BadgeProps, 'label' | 'tone' | 'icon'>> = {
  below: { label: 'Below target', tone: 'danger' },
  near: { label: 'Near target', tone: 'blue' },
  achieved: { label: 'Achieved', tone: 'success', icon: 'check' },
};

/** The badge of an achievement level. A level the app does not know shows as the server sent it. */
export function levelBadge(level: AchievementLevel): Pick<BadgeProps, 'label' | 'tone' | 'icon'> {
  return LEVELS[level] ?? { label: sentenceCase(level), tone: 'neutral' };
}

export type Trend = 'gain' | 'flat' | 'loss';

/** How a level reads on a market surface: `achieved` is a gain, `below` a loss, the rest flat. */
export function levelTrend(level: AchievementLevel): Trend {
  if (level === 'achieved') return 'gain';
  if (level === 'below') return 'loss';
  return 'flat';
}

/** 64.6 -> "65%". The server already rounds group and branch figures; the total has decimals. */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** How far from the target, in words: what is left to sell, or how far above it the sales are. */
export function describeBalance(balance: number, formatAmount: (value: number) => string): string {
  return balance < 0 ? `${formatAmount(-balance)} to go` : `${formatAmount(balance)} above target`;
}
