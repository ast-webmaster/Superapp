import type { BadgeProps } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

import type { PurchaseRequestStatus } from '../types';

export const statusLabels: Record<PurchaseRequestStatus, string> = {
  DRAFT: 'Draft',
  SUBMISSION: 'Submitted',
  AWAITING: 'Awaiting',
  APPROVED: 'Approved',
  PROCESSED: 'Processed',
  REVISE: 'Needs revision',
  REJECTED: 'Rejected',
  CANCELED: 'Canceled',
  COMPLETED: 'Completed',
  RECEIVED: 'Received',
};

const statusTones: Record<PurchaseRequestStatus, NonNullable<BadgeProps['tone']>> = {
  DRAFT: 'neutral',
  SUBMISSION: 'info',
  AWAITING: 'warning',
  APPROVED: 'success',
  PROCESSED: 'info',
  REVISE: 'warning',
  REJECTED: 'danger',
  CANCELED: 'neutral',
  COMPLETED: 'success',
  RECEIVED: 'success',
};

/** The API may send a status the app does not know yet; show it as it is. */
export function statusBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return status in statusLabels
    ? {
        label: statusLabels[status as PurchaseRequestStatus],
        tone: statusTones[status as PurchaseRequestStatus],
      }
    : { label: status, tone: 'neutral' };
}

/** Badge for one step of the approval chain. A step uses the same words as a status. */
export function stepBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return status in statusLabels
    ? statusBadge(status)
    : { label: sentenceCase(status), tone: 'neutral' };
}
