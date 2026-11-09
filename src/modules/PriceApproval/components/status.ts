import type { BadgeProps } from '@/shared/ui';
import { formatMoney, sentenceCase } from '@/shared/utils/format';

import type { PriceApprovalLine, PriceApprovalStatus } from '../types';

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

/** Badge for one step of the approval chain. "SUBMITED" is how the backend spells it. */
export function stepBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return {
    label: status === 'SUBMITED' ? 'Submitted' : sentenceCase(status),
    tone: stepTones[status] ?? 'neutral',
  };
}

/**
 * `discount` on a line is a code, not an amount: 1 none, 2 percent (`percent`), 3 nominal
 * (`nominal`). The badge shows the one the line uses.
 */
export function discountBadge(
  line: Pick<PriceApprovalLine, 'discount' | 'percent' | 'nominal'>,
): Pick<BadgeProps, 'label' | 'tone'> {
  switch (line.discount) {
    case '1':
      return { label: 'No discount', tone: 'neutral' };
    case '2':
      return { label: `Discount: ${line.percent} %`, tone: 'info' };
    case '3':
      return { label: `Discount: ${formatMoney(line.nominal)}`, tone: 'info' };
    default:
      return { label: line.discount ?? '-', tone: 'neutral' };
  }
}
