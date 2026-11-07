import type { BadgeProps } from '@/shared/ui';

import type { PriceApprovalStatus } from '../types';

export const statusLabels: Record<PriceApprovalStatus, string> = {
  AWAITING: 'Awaiting',
  PENDING: 'Pending',
  FINISH: 'Finished',
  REJECTED: 'Rejected',
  CANCELED: 'Canceled',
  DRAFT: 'Draft',
};

const statusTones: Record<PriceApprovalStatus, NonNullable<BadgeProps['tone']>> = {
  AWAITING: 'warning',
  PENDING: 'info',
  FINISH: 'success',
  REJECTED: 'danger',
  CANCELED: 'neutral',
  DRAFT: 'neutral',
};

/** The API may send a status the app does not know yet; show it as it is. */
export function statusBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return status in statusLabels
    ? { label: statusLabels[status as PriceApprovalStatus], tone: statusTones[status as PriceApprovalStatus] }
    : { label: status, tone: 'neutral' };
}
