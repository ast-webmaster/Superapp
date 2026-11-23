/** 1234.5 -> "1,234.5"; 120 -> "120". Quantities and counts, at most one decimal. */
export function formatNumber(value: number): string {
  const [whole = '0', decimals] = (Math.round(value * 10) / 10).toString().split('.');
  const sign = whole.startsWith('-') ? '-' : '';
  const grouped = whole.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${grouped}${decimals ? `.${decimals}` : ''}`;
}

/** 66 -> "66%"; 6.25 -> "6.3%". `null` (no target, no earlier period) reads as a dash. */
export function formatPercent(value: number | null): string {
  return value === null ? '-' : `${formatNumber(value)}%`;
}

/** 5 -> "+5%"; -20 -> "-20%". A change, so the sign is always shown. */
export function formatSignedPercent(value: number | null): string {
  if (value === null) return '-';
  return `${value > 0 ? '+' : ''}${formatPercent(value)}`;
}

/** Months on hand, 2 -> "2 mo". A dash when nothing was sold, so there is no estimate. */
export function formatMoh(value: number | null): string {
  return value === null ? '-' : `${formatNumber(value)} mo`;
}
