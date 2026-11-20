/**
 * How long a loaded report stays fresh. The sales team updates the data once a morning, between
 * 09:00 and 10:00 (and rarely corrects it later), so a report loaded at any time is current until
 * the next 10:00 and asking the server again before then only returns the same figures. The
 * default 60 s `staleTime` would ask on almost every visit to the menu.
 *
 * The hour is read in the phone's own time zone, which for these users is the office's.
 */

/** The hour by which the day's update is finished. */
export const UPDATE_DEADLINE_HOUR = 10;

/** Keep an unused report in memory for a day, so coming back to the menu never shows a skeleton. */
export const REPORT_GC_TIME_MS = 24 * 60 * 60 * 1000;

/**
 * "Update data" can be used once an hour: the figures change once a morning, so asking more
 * often only costs the server. Measured from when the data was last loaded, whatever loaded it.
 */
export const REFRESH_COOLDOWN_MS = 60 * 60 * 1000;

/** When "Update data" can next be used, given when the data was last loaded. */
export function nextRefreshAt(loadedAt: number): number {
  return loadedAt + REFRESH_COOLDOWN_MS;
}

/** Whether the data is old enough to be updated by hand. */
export function canRefresh(loadedAt: number, now: number = Date.now()): boolean {
  return now >= nextRefreshAt(loadedAt);
}

/** The first 10:00 after `from`, as a timestamp. At exactly 10:00 it is the next day's. */
export function nextUpdateDeadline(from: number): number {
  const deadline = new Date(from);
  deadline.setHours(UPDATE_DEADLINE_HOUR, 0, 0, 0);
  if (deadline.getTime() <= from) deadline.setDate(deadline.getDate() + 1);
  return deadline.getTime();
}

/**
 * React Query's `staleTime` as a function of the query: the time from when its data was loaded
 * to the next 10:00. Data loaded before 10:00 (possibly before the update finished) goes stale at
 * 10:00 the same day; data loaded after it stays fresh until 10:00 the next day.
 */
export function reportStaleTime(query: { state: { dataUpdatedAt: number } }): number {
  const loadedAt = query.state.dataUpdatedAt;
  return nextUpdateDeadline(loadedAt) - loadedAt;
}
