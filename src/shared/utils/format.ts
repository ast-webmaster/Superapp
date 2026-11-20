// App-wide display formats. Every module shows dates and money through these.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/;

function parts(value: string) {
  const match = DATE_TIME.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const name = MONTHS[Number(month) - 1];
  if (!name) return null;
  return { date: `${Number(day)} ${name} ${year}`, time: hour ? `${hour}:${minute}` : null };
}

/**
 * "2026-10-01" or "2026-10-01 14:30:00" -> "1 Okt 2026". Read from the text, not through `Date`,
 * so the day never shifts with the phone's time zone. Anything else comes back as it was.
 */
export function formatDate(value: string): string {
  return parts(value)?.date ?? value;
}

/** "2026-10-01" -> "1 Okt". For chart axes and other places where the year is already known. */
export function formatShortDate(value: string): string {
  const found = parts(value);
  return found ? found.date.slice(0, found.date.lastIndexOf(' ')) : value;
}

const YEAR_MONTH = /^(\d{4})-(\d{2})$/;

/** "2026-11" -> "Nov 2026". A month and year, as a report period is named. Anything else comes back as it was. */
export function formatMonth(value: string): string {
  const match = YEAR_MONTH.exec(value);
  const name = match ? MONTHS[Number(match[2]) - 1] : undefined;
  return match && name ? `${name} ${match[1]}` : value;
}

/** "2026-10-01 14:30:00" -> "1 Okt 2026 14:30". A value without a time is just the date. */
export function formatDateTime(value: string): string {
  const found = parts(value);
  if (!found) return value;
  return found.time ? `${found.date} ${found.time}` : found.date;
}

/** 20000 -> "Rp 20,000"; 20000.5 -> "Rp 20,000.50". Decimals show only when the amount has them. */
export function formatMoney(value: number): string {
  const [whole = '0', decimals = '00'] = Math.abs(value).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = value < 0 && (whole !== '0' || decimals !== '00') ? '-' : '';
  return `${sign}Rp ${grouped}${decimals === '00' ? '' : `.${decimals}`}`;
}

const COMPACT_UNITS = [
  { size: 1e3, unit: 'K' },
  { size: 1e6, unit: 'M' },
  { size: 1e9, unit: 'B' },
  { size: 1e12, unit: 'T' },
] as const;

/**
 * 1250000 -> "Rp 1.3M", 950 -> "Rp 950". For chart axes and labels where the full amount does
 * not fit; the full amount (`formatMoney`) stays in the text beside the chart.
 */
export function formatCompactMoney(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 && Math.round(abs) !== 0 ? '-' : '';
  for (let index = COMPACT_UNITS.length - 1; index >= 0; index -= 1) {
    const { size, unit } = COMPACT_UNITS[index]!;
    if (abs < size) continue;
    const scaled = abs / size;
    const rounded = scaled >= 100 ? Math.round(scaled) : Math.round(scaled * 10) / 10;
    // 999,960 rounds to "1000K"; the next unit up reads "1M".
    const next = COMPACT_UNITS[index + 1];
    if (rounded >= 1000 && next) return `${sign}Rp 1${next.unit}`;
    return `${sign}Rp ${rounded}${unit}`;
  }
  return `${sign}Rp ${Math.round(abs)}`;
}

/** A `Date`'s weekday as "Sen", in the phone's own time zone. */
export function formatWeekday(date: Date): string {
  return WEEKDAYS[date.getDay()]!;
}

/** A `Date` as "Sen, 9 Nov", in the phone's own time zone: it is for "today", not for stored data. */
export function formatWeekdayDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "AWAITING" -> "Awaiting", "PRODUCT MANAGER" -> "Product manager". The backend sends statuses in capitals. */
export function sentenceCase(value: string): string {
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** ["Sales", "Admin"] -> "Sales +1". The first role plus how many more; null when there is none. */
export function formatRoles(roles: string[]): string | null {
  const [first, ...others] = roles;
  if (!first) return null;
  return others.length > 0 ? `${first} +${others.length}` : first;
}

const clock = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

const pad = (value: number) => String(value).padStart(2, '0');

/** When the data on screen came from the server: time only today, date and time before. */
export function formatSyncedAt(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toDateString() === new Date().toDateString()
    ? clock.format(date)
    : formatDateTime(
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`,
      );
}
