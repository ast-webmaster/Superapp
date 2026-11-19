const pad = (value: number) => String(value).padStart(2, '0');

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A `Date` as YYYY-MM-DD in the phone's own time zone. */
export function toIsoDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso(now: Date = new Date()): string {
  return toIsoDay(now);
}

/** True for a real calendar day written as YYYY-MM-DD. */
export function isIsoDay(value: string | undefined): value is string {
  if (!value) return false;
  const match = ISO_DAY.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Noon, so a daylight-saving shift can never move the day. */
export function parseIsoDay(value: string): Date {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addDays(value: string, days: number): string {
  const date = parseIsoDay(value);
  date.setDate(date.getDate() + days);
  return toIsoDay(date);
}
