/** The server answers at most this many rows per search (`PriceApprovalLookupService::LIMIT`). */
export const LOOKUP_LIMIT = 50;
/** Shorter text matches too much of a list with thousands of rows to be worth a request. */
export const LOOKUP_MIN_CHARS = 2;

/**
 * The text that goes to the server. Spaces are trimmed; text shorter than the minimum counts as
 * no search, so the list stays on the default rows instead of firing a request per first letter.
 */
export function lookupSearchTerm(text: string): string {
  const trimmed = text.trim();
  return trimmed.length >= LOOKUP_MIN_CHARS ? trimmed : '';
}
