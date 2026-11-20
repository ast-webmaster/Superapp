import type { BadgeProps } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

type Tone = NonNullable<BadgeProps['tone']>;
type BadgeSpec = Pick<BadgeProps, 'label' | 'tone'>;

/** The card statuses, in the order the flow goes. The list filter offers these. */
export const AUDIT_STATUSES = [
  'PLANNED',
  'ON PROGRESS',
  'AWAITING FOLLOW UP',
  'AWAITING APPROVAL',
  'COMPLETED',
  'REJECTED',
] as const;

const statusTones: Record<string, Tone> = {
  PLANNED: 'neutral',
  'ON PROGRESS': 'info',
  'AWAITING FOLLOW UP': 'warning',
  'AWAITING APPROVAL': 'warning',
  COMPLETED: 'success',
  REJECTED: 'danger',
};

/** The API may send a status the app does not know yet; show it as it is. */
export function statusBadge(status: string): BadgeSpec {
  return { label: sentenceCase(status), tone: statusTones[status] ?? 'neutral' };
}

const programTones: Record<string, Tone> = { NEW: 'neutral', PENDING: 'warning', DONE: 'success' };

export function programBadge(status: string): BadgeSpec {
  return { label: sentenceCase(status), tone: programTones[status] ?? 'neutral' };
}

const categoryTones: Record<string, Tone> = {
  MINOR: 'warning',
  MAJOR: 'danger',
  OBSERVASI: 'info',
};

export function categoryBadge(category: string): BadgeSpec {
  return { label: sentenceCase(category), tone: categoryTones[category] ?? 'neutral' };
}

/** What a line of the approval log did, in plain words. "SUBMITED" is how the backend spells it. */
const logLabels: Record<string, string> = {
  'ON PROGRESS': 'Started',
  'SUBMITED AUDIT': 'Submitted',
  'FOLLOW UP': 'Followed up',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ASSIGN: 'Reassigned',
};

const logTones: Record<string, Tone> = {
  APPROVED: 'success',
  REJECTED: 'danger',
  'FOLLOW UP': 'info',
  'SUBMITED AUDIT': 'info',
};

export function logBadge(status: string): BadgeSpec {
  return { label: logLabels[status] ?? sentenceCase(status), tone: logTones[status] ?? 'neutral' };
}
