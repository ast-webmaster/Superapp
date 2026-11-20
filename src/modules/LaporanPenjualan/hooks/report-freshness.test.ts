import {
  canRefresh,
  nextRefreshAt,
  nextUpdateDeadline,
  REFRESH_COOLDOWN_MS,
  reportStaleTime,
} from './report-freshness';

const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 10, day, hour, minute).getTime();

const HOUR = 60 * 60 * 1000;

describe('nextUpdateDeadline', () => {
  it('is 10:00 the same day for data loaded before it', () => {
    expect(nextUpdateDeadline(at(20, 8, 30))).toBe(at(20, 10));
    expect(nextUpdateDeadline(at(20, 9, 59))).toBe(at(20, 10));
  });

  it('is 10:00 the next day for data loaded at or after 10:00', () => {
    expect(nextUpdateDeadline(at(20, 10))).toBe(at(21, 10));
    expect(nextUpdateDeadline(at(20, 17, 15))).toBe(at(21, 10));
    expect(nextUpdateDeadline(at(20, 23, 59))).toBe(at(21, 10));
  });

  it('rolls over the end of a month', () => {
    expect(nextUpdateDeadline(new Date(2026, 10, 30, 11).getTime())).toBe(
      new Date(2026, 11, 1, 10).getTime(),
    );
  });
});

describe('reportStaleTime', () => {
  it('is the time from loading to the next 10:00', () => {
    expect(reportStaleTime({ state: { dataUpdatedAt: at(20, 8) } })).toBe(2 * HOUR);
    expect(reportStaleTime({ state: { dataUpdatedAt: at(20, 11) } })).toBe(23 * HOUR);
  });

  it('is a full day for data loaded exactly at 10:00', () => {
    expect(reportStaleTime({ state: { dataUpdatedAt: at(20, 10) } })).toBe(24 * HOUR);
  });
});

describe('the once-an-hour limit on "Update data"', () => {
  it('opens one hour after the data was loaded', () => {
    const loadedAt = at(20, 10, 15);

    expect(nextRefreshAt(loadedAt)).toBe(loadedAt + REFRESH_COOLDOWN_MS);
    expect(nextRefreshAt(loadedAt)).toBe(at(20, 11, 15));
  });

  it('is closed until then and open from then on', () => {
    const loadedAt = at(20, 10, 15);

    expect(canRefresh(loadedAt, at(20, 10, 16))).toBe(false);
    expect(canRefresh(loadedAt, at(20, 11, 14))).toBe(false);
    expect(canRefresh(loadedAt, at(20, 11, 15))).toBe(true);
    expect(canRefresh(loadedAt, at(20, 15))).toBe(true);
  });
});
