/** The number in text a user typed: "1.5" or "1,5". Empty or broken text is 0. */
export function parseAmount(text: string): number {
  const value = Number(text.trim().replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

/** Keeps digits and one decimal point, so a numeric field cannot hold anything else. */
function sanitizeAmount(text: string): string {
  const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  return rest.length > 0 ? `${whole}.${rest.join('')}` : whole;
}

/** For a rupiah field the user sees grouped ("100,000"): drops the commas, keeps one decimal point. */
export function sanitizeMoney(text: string): string {
  return sanitizeAmount(text.replace(/,/g, ''));
}

/** Digits only, for a whole-number field. */
export function sanitizeInteger(text: string): string {
  return text.replace(/\D/g, '');
}

/** "100000.5" -> "100,000.5". For showing a rupiah field while its raw value stays plain digits. */
export function groupThousands(raw: string): string {
  const [whole = '', decimals] = raw.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimals === undefined ? grouped : `${grouped}.${decimals}`;
}
