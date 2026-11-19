/** Days are `YYYY-MM-DD` text, so they compare as text and never pick up a time zone. */
export type DayRange = { start: string; end: string };

function toUtc(day: string): number {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number);
  return Date.UTC(year, month - 1, date);
}

/** Days from start to end with both counted, as the server counts them for the allowance. */
export function daysInRange(start: string | null, end: string | null): number {
  if (!start || !end || end < start) return 0;
  return Math.round((toUtc(end) - toUtc(start)) / 86_400_000) + 1;
}

/** True when two ranges share a day. The server refuses overlapping destinations. */
export function rangesOverlap(a: DayRange, b: DayRange): boolean {
  return a.start <= b.end && b.start <= a.end;
}
