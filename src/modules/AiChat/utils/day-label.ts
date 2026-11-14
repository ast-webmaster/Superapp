import { formatDate, formatWeekdayDate } from '@/shared/utils/format';

// Chat times are moments (the server sends UTC), so they read in the phone's own time zone.

const pad = (value: number) => String(value).padStart(2, '0');

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function isSameDay(a: string, b: string): boolean {
  return startOfDay(new Date(a)) === startOfDay(new Date(b));
}

/** "Today · 14:42", "Yesterday · 09:05", or "Rab, 11 Nov · 09:05". */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days === 0) return `Today · ${time}`;
  if (days === 1) return `Yesterday · ${time}`;
  return `${formatWeekdayDate(date)} · ${time}`;
}

/** "14 Nov 2026" for a moment, on the phone's calendar. */
export function localDate(iso: string): string {
  const date = new Date(iso);
  return formatDate(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);
}
