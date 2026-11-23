import type { BadgeProps } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

type BadgeLook = Pick<BadgeProps, 'label' | 'tone' | 'icon'>;

// Tones follow the status key, not the `status_color` hint the server sends for the web.
const MOH: Record<string, BadgeProps['tone']> = {
  NEED_ORDER: 'danger',
  NORMAL: 'success',
  OVERSTOCK: 'warning',
  NO_MOVEMENT: 'neutral',
};

/** The badge of a stock status. A status the app does not know shows with the server's label. */
export function mohBadge(status: string, label: string): BadgeLook {
  return { label, tone: MOH[status] ?? 'neutral', icon: status === 'NORMAL' ? 'check' : undefined };
}

const ACHIEVEMENT: Record<string, BadgeLook> = {
  ABOVE_LINEARITY: { label: 'Above linearity', tone: 'success', icon: 'check' },
  ON_TRACK: { label: 'On track', tone: 'blue' },
  WARNING: { label: 'Warning', tone: 'warning' },
  CRITICAL: { label: 'Critical', tone: 'danger' },
  NO_TARGET: { label: 'No target', tone: 'neutral' },
};

/** The badge of an achievement status. An unknown status shows as the server sent it. */
export function achievementBadge(status: string): BadgeLook {
  return ACHIEVEMENT[status] ?? { label: sentenceCase(status.toLowerCase()), tone: 'neutral' };
}
