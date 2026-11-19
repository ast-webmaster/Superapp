import type { BadgeProps } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

import type { ProductBorrowingStatus } from '../types';

export const statusLabels: Record<ProductBorrowingStatus, string> = {
  'AWAITING APPROVAL': 'Awaiting approval',
  'AWAITING PROCESS': 'Awaiting process',
  BORROWED: 'Borrowed',
  RECEIVED: 'Received',
  'REQUEST EXTEND': 'Extension requested',
  REVISE: 'Needs revision',
  REJECTED: 'Rejected',
  CANCELED: 'Canceled',
};

const statusTones: Record<ProductBorrowingStatus, NonNullable<BadgeProps['tone']>> = {
  'AWAITING APPROVAL': 'warning',
  'AWAITING PROCESS': 'warning',
  BORROWED: 'info',
  RECEIVED: 'success',
  'REQUEST EXTEND': 'warning',
  REVISE: 'warning',
  REJECTED: 'danger',
  CANCELED: 'neutral',
};

/** The API may send a status the app does not know yet; show it as it is. */
export function statusBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return status in statusLabels
    ? {
        label: statusLabels[status as ProductBorrowingStatus],
        tone: statusTones[status as ProductBorrowingStatus],
      }
    : { label: status, tone: 'neutral' };
}

/** Badge for an item, an extension or one step of the approval log: the same words as a status. */
export function stepBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return status in statusLabels
    ? statusBadge(status)
    : { label: sentenceCase(status), tone: 'neutral' };
}

/** The statuses that mean someone still has to act. One chip groups them. */
export const AWAITING_STATUSES = 'AWAITING APPROVAL,AWAITING PROCESS,REQUEST EXTEND';
