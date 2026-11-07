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
    ? {
        label: statusLabels[status as PriceApprovalStatus],
        tone: statusTones[status as PriceApprovalStatus],
      }
    : { label: status, tone: 'neutral' };
}

const stepTones: Record<string, NonNullable<BadgeProps['tone']>> = {
  AWAITING: 'warning',
  PENDING: 'info',
  APPROVED: 'success',
  'NO APPROVAL NEEDED': 'success',
  REJECTED: 'danger',
};

/** "PRODUCT MANAGER" -> "Product manager". Tier and step names arrive in capitals. */
export function sentenceCase(value: string) {
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Badge for one step of the approval chain. "SUBMITED" is how the backend spells it. */
export function stepBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return {
    label: status === 'SUBMITED' ? 'Submitted' : sentenceCase(status),
    tone: stepTones[status] ?? 'neutral',
  };
}
