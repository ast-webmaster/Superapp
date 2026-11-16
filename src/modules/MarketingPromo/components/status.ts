import type { BadgeProps } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

import type { MarketingPromoStatus } from '../types';

export const statusLabels: Record<MarketingPromoStatus, string> = {
  AWAITING: 'Awaiting',
  REVISE: 'Needs revision',
  REJECTED: 'Rejected',
  CANCELED: 'Canceled',
  APPROVED: 'Approved',
  ONGOING: 'Ongoing',
  'AWAITING RECAP': 'Awaiting recap',
  'AWAITING APPROVAL RECAP': 'Recap approval',
  'REVISE RECAP': 'Recap revision',
  'AWAITING APPROVAL REVISE': 'Revision approval',
  'AWAITING REALIZATION': 'Awaiting realization',
  'REALIZATION APPROVAL': 'Realization approval',
  'APPROVAL ADDITIONAL COST': 'Additional cost approval',
  'REVISE ADDITIONAL COST': 'Additional cost revision',
  COMPLETED: 'Completed',
};

const statusTones: Record<MarketingPromoStatus, NonNullable<BadgeProps['tone']>> = {
  AWAITING: 'warning',
  REVISE: 'warning',
  REJECTED: 'danger',
  CANCELED: 'neutral',
  APPROVED: 'success',
  ONGOING: 'info',
  'AWAITING RECAP': 'info',
  'AWAITING APPROVAL RECAP': 'warning',
  'REVISE RECAP': 'warning',
  'AWAITING APPROVAL REVISE': 'warning',
  'AWAITING REALIZATION': 'info',
  'REALIZATION APPROVAL': 'warning',
  'APPROVAL ADDITIONAL COST': 'warning',
  'REVISE ADDITIONAL COST': 'warning',
  COMPLETED: 'success',
};

/** The API may send a status the app does not know yet; show it as it is. */
export function statusBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return status in statusLabels
    ? {
        label: statusLabels[status as MarketingPromoStatus],
        tone: statusTones[status as MarketingPromoStatus],
      }
    : { label: status, tone: 'neutral' };
}

/** Badge for one step of the approval log. A step uses the same words as a status. */
export function stepBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return status in statusLabels
    ? statusBadge(status)
    : { label: sentenceCase(status), tone: status === 'REJECTED' ? 'danger' : 'neutral' };
}

/** Badge for the recap outcome (`recap_status`). */
export function recapBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return { label: sentenceCase(status), tone: status === 'ACHIEVED' ? 'success' : 'warning' };
}

/** Who may hold a promo (`last_updated_tier`), in approval order, for the filter sheet. */
export const TIERS = [
  'Marketing Specialist',
  'Product Manager',
  'Marcom Manager',
  'Director',
  'Finance Staf',
  'Finance Manager',
  'President Director',
] as const;
