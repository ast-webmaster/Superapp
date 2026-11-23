import type { BadgeProps } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

type Tone = NonNullable<BadgeProps['tone']>;

// The statuses of both flows. The API may send one the app does not know yet: it is shown as sent.
const known: Record<string, { label: string; tone: Tone }> = {
  AWAITING: { label: 'Awaiting approval', tone: 'warning' },
  'AWAITING PROCESSED': { label: 'Awaiting process', tone: 'warning' },
  'AWAITING RECEIVED': { label: 'Awaiting receipt', tone: 'warning' },
  SUCCESS: { label: 'Approved', tone: 'success' },
  RECEIVED: { label: 'Received', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  REJECT: { label: 'Rejected', tone: 'danger' },
  CANCEL: { label: 'Canceled', tone: 'neutral' },
};

export function statusLabel(status: string): string {
  return known[status]?.label ?? status;
}

export function statusBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return known[status] ?? { label: status, tone: 'neutral' };
}

/** Badge for one step of the approval log, whose statuses (SUBMITTED, APPROVED...) are free text. */
export function stepBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return status in known ? statusBadge(status) : { label: sentenceCase(status), tone: 'neutral' };
}
