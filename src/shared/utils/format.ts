// App-wide display formats. Every module shows dates and money through these.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

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
