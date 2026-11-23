import type { BadgeProps } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

type Tone = NonNullable<BadgeProps['tone']>;

/** The statuses the app knows, in the order the work moves. The API may send another: shown as sent. */
export const STATUSES = [
  'AWAITING PICK',
  'PICKED',
  'REQUEST DUE DATE',
  'AWAITING APPROVAL',
  'COMPLETED',
  'CANCEL',
] as const;

/** Statuses where the work is still going, joined for the "In progress" chip. */
export const IN_PROGRESS_STATUSES = STATUSES.slice(0, 4).join(',');

const known: Record<string, { label: string; tone: Tone }> = {
  'AWAITING PICK': { label: 'Awaiting pick', tone: 'warning' },
  PICKED: { label: 'In progress', tone: 'info' },
  'REQUEST DUE DATE': { label: 'New due date asked', tone: 'warning' },
  'AWAITING APPROVAL': { label: 'Awaiting approval', tone: 'warning' },
  COMPLETED: { label: 'Completed', tone: 'success' },
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

export const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;

const priorities: Record<string, { label: string; tone: Tone }> = {
  HIGH: { label: 'High priority', tone: 'danger' },
  MEDIUM: { label: 'Medium priority', tone: 'neutral' },
  LOW: { label: 'Low priority', tone: 'neutral' },
};

export function priorityLabel(priority: string): string {
  return priorities[priority]?.label ?? priority;
}

export function priorityBadge(priority: string): Pick<BadgeProps, 'label' | 'tone'> {
  return priorities[priority] ?? { label: priority, tone: 'neutral' };
}
