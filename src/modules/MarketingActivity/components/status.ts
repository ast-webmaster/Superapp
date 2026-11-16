import type { BadgeProps } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

import type { MarketingActivityStatus } from '../types';

export const statusLabels: Record<MarketingActivityStatus, string> = {
  AWAITING: 'Awaiting',
  REVISE: 'Needs revision',
  REJECTED: 'Rejected',
  CANCELED: 'Canceled',
  ONGOING: 'Ongoing',
  'AWAITING REALIZATION': 'Awaiting realization',
  'REALIZATION APPROVAL': 'Realization approval',
  'AWAITING CLAIM': 'Awaiting claim',
  'APPROVAL ADDITIONAL COST': 'Additional cost approval',
  'REVISE ADDITIONAL COST': 'Additional cost revision',
  COMPLETED: 'Completed',
};

const statusTones: Record<MarketingActivityStatus, NonNullable<BadgeProps['tone']>> = {
  AWAITING: 'warning',
  REVISE: 'warning',
  REJECTED: 'danger',
  CANCELED: 'neutral',
  ONGOING: 'info',
  'AWAITING REALIZATION': 'info',
  'REALIZATION APPROVAL': 'warning',
  'AWAITING CLAIM': 'info',
  'APPROVAL ADDITIONAL COST': 'warning',
  'REVISE ADDITIONAL COST': 'warning',
  COMPLETED: 'success',
};

/** The API may send a status the app does not know yet; show it as it is. */
export function statusBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return status in statusLabels
    ? {
        label: statusLabels[status as MarketingActivityStatus],
        tone: statusTones[status as MarketingActivityStatus],
      }
    : { label: status, tone: 'neutral' };
}

/** Badge for one step of the approval log. A step uses the same words as a status. */
export function stepBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return status in statusLabels
    ? statusBadge(status)
    : { label: sentenceCase(status), tone: status === 'REJECTED' ? 'danger' : 'neutral' };
}

/** Who may hold an activity (`last_updated_tier`), in approval order, for the filter sheet. */
export const TIERS = [
  'Marketing Specialist',
  'Product Manager',
  'Marcom Manager',
  'Director',
  'Finance Staf',
  'Finance Manager',
  'President Director',
] as const;
