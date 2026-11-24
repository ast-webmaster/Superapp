import type { BadgeProps } from '@/shared/ui';

type Tone = NonNullable<BadgeProps['tone']>;

/** The statuses the app knows, in the order a visit moves. The API may send another: shown as sent. */
export const STATUSES = ['PLANNED', 'CHECK-IN', 'COMPLETED'] as const;

const known: Record<string, { label: string; tone: Tone }> = {
  PLANNED: { label: 'Planned', tone: 'info' },
  'CHECK-IN': { label: 'On site', tone: 'warning' },
  COMPLETED: { label: 'Completed', tone: 'success' },
};

export function statusLabel(status: string): string {
  return known[status]?.label ?? status;
}

export function statusBadge(status: string): Pick<BadgeProps, 'label' | 'tone'> {
  return known[status] ?? { label: status, tone: 'neutral' };
}

/** How the server rated a check-out. Anything else is shown as sent. */
const notes: Record<string, { label: string; tone: Tone }> = {
  'VISITATION COMPLETED': { label: 'Visit counted', tone: 'success' },
  'EARLY CHECKOUT': { label: 'Left early', tone: 'warning' },
  'FORGOT VISITATION': { label: 'Outside the radius at check-out', tone: 'warning' },
  'NOT COUNTED VISITATION': { label: 'Not counted', tone: 'danger' },
};

export function noteBadge(note: string): Pick<BadgeProps, 'label' | 'tone'> {
  return notes[note] ?? { label: note, tone: 'neutral' };
}

/** What a GPS flag means. Flags only mark something odd; they never block a visit. */
const flags: Record<string, string> = {
  NEAR_EXACT_POINT: 'The position is exactly on the planned point, which a real GPS rarely is.',
  ROUND_ACCURACY: 'The accuracy is a round, very small number.',
  IMPOSSIBLE_SPEED: 'Too fast a move from the previous visit point.',
  DUPLICATE_COORDINATES: 'The same coordinates as another visit.',
  FILE_PHOTO: 'The photo came from a file, not straight from the camera.',
  EXIF_TIME_MISMATCH: 'The photo was taken at a very different time.',
  MOCK_LOCATION: 'The phone reported a mock location.',
};

export function flagText(flag: string): string {
  return flags[flag] ?? flag;
}
