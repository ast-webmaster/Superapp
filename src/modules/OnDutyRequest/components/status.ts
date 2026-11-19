import type { BadgeProps } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

import type { OnDutyRequestStatus } from '../types';

export const statusLabels: Record<OnDutyRequestStatus, string> = {
  SUBMISSION: 'Submitted',
  AWAITING: 'Awaiting',
  REVISE: 'Needs revision',
  REJECTED: 'Rejected',
  CANCELED: 'Canceled',
  APPROVED: 'Approved',
  DECLARATION: 'Declaration',
  'AWAITING APPROVAL DECLARATION': 'Declaration awaiting',
  'REVISE DECLARATION': 'Declaration needs revision',
  DONE: 'Done',
};

const statusTones: Record<OnDutyRequestStatus, NonNullable<BadgeProps['tone']>> = {
  SUBMISSION: 'info',
  AWAITING: 'warning',
  REVISE: 'warning',
  REJECTED: 'danger',
  CANCELED: 'neutral',
  APPROVED: 'success',
  DECLARATION: 'info',
  'AWAITING APPROVAL DECLARATION': 'warning',
  'REVISE DECLARATION': 'warning',
  DONE: 'success',
};

/** The API may send a status the app does not know yet; show it as it is. */
export function statusBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return status in statusLabels
    ? {
        label: statusLabels[status as OnDutyRequestStatus],
        tone: statusTones[status as OnDutyRequestStatus],
      }
    : { label: status, tone: 'neutral' };
}

/** Badge for one step of an approval chain. A step uses the same words as a status. */
export function stepBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return status in statusLabels
    ? statusBadge(status)
    : { label: sentenceCase(status), tone: 'neutral' };
}

export const tripTypeLabels = { DOMESTIC: 'Domestic', OVERSEAS: 'Overseas' } as const;

/** "DOMESTIC" -> "Domestic"; a value the app does not know is shown as it is. */
export function tripTypeLabel(type: string | null): string | null {
  if (!type) return null;
  return type in tripTypeLabels ? tripTypeLabels[type as keyof typeof tripTypeLabels] : type;
}
