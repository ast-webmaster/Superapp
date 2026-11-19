import { addDays, isIsoDay, parseIsoDay, toIsoDay, todayIso } from './dates';

describe('dates', () => {
  it('writes a date in the local time zone', () => {
    expect(toIsoDay(new Date(2026, 10, 24, 23, 59))).toBe('2026-11-24');
    expect(todayIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('accepts only real days', () => {
    expect(isIsoDay('2026-11-24')).toBe(true);
    expect(isIsoDay('2026-02-30')).toBe(false);
    expect(isIsoDay('24-11-2026')).toBe(false);
    expect(isIsoDay(undefined)).toBe(false);
  });

  it('moves across month and year ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('parses to the same day', () => {
    expect(toIsoDay(parseIsoDay('2026-11-24'))).toBe('2026-11-24');
  });
});
