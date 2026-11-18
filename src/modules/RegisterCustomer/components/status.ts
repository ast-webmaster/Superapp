import type { BadgeProps } from '@/shared/ui';

type BadgeLook = Pick<BadgeProps, 'label' | 'tone'>;

/** Statuses of the document. The API may send one the app does not know yet; it shows as sent. */
const statuses: Record<string, BadgeLook> = {
  'AWAITING CONFIRMATION': { label: 'Awaiting confirmation', tone: 'warning' },
  'AWAITING APPROVAL': { label: 'Awaiting approval', tone: 'warning' },
  REVISE: { label: 'Revise', tone: 'info' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  DRAFT: { label: 'Draft', tone: 'neutral' },
};

export function statusBadge(status: string): BadgeLook {
  return statuses[status] ?? { label: status, tone: 'neutral' };
}

/** What the list can be narrowed to. A value may join several statuses with commas. */
export const AWAITING_STATUSES = 'AWAITING CONFIRMATION,AWAITING APPROVAL';

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: AWAITING_STATUSES, label: 'Awaiting' },
  { value: 'REVISE', label: 'Revise' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'COMPLETED', label: 'Completed' },
];

/** Rows of the approval log. The backend spells the steps in capitals, finance included. */
const steps: Record<string, BadgeLook> = {
  'REQUEST REGISTER': { label: 'Requested', tone: 'neutral' },
  CONFIRMED: { label: 'Confirmed', tone: 'success' },
  'AWAITING APPROVAL': { label: 'Awaiting manager', tone: 'warning' },
  'AWAITING APPROVAL FINANCE': { label: 'Awaiting finance', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  REVISE: { label: 'Revise', tone: 'info' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
};

export function stepBadge(status: string): BadgeLook {
  return steps[status] ?? { label: status, tone: 'neutral' };
}
