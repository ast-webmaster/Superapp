import type { BadgeProps } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

const statuses: Record<string, Pick<BadgeProps, 'label' | 'tone'>> = {
  BOOKED: { label: 'Booked', tone: 'success' },
  ENDED: { label: 'Ended', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
};

/** The API may send a status the app does not know yet; show it as it is. */
export function statusBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return statuses[status] ?? { label: sentenceCase(status), tone: 'neutral' };
}
