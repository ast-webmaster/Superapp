import { formatDate, formatDateTime, formatMoney } from './format';

describe('formatDate', () => {
  it('writes day, short Indonesian month and year', () => {
    expect(formatDate('2026-10-01')).toBe('1 Okt 2026');
    expect(formatDate('2026-08-31')).toBe('31 Agu 2026');
    expect(formatDate('2026-05-09')).toBe('9 Mei 2026');
  });

  it('ignores the time of a datetime', () => {
    expect(formatDate('2026-10-01 14:30:00')).toBe('1 Okt 2026');
  });

  it('returns text it cannot read as it was', () => {
    expect(formatDate('soon')).toBe('soon');
    expect(formatDate('2026-13-01')).toBe('2026-13-01');
  });
});

describe('formatDateTime', () => {
  it('adds the time when there is one', () => {
    expect(formatDateTime('2026-10-01 14:30:00')).toBe('1 Okt 2026 14:30');
    expect(formatDateTime('2026-10-01T09:05:00+07:00')).toBe('1 Okt 2026 09:05');
  });

  it('is just the date without a time', () => {
    expect(formatDateTime('2026-10-01')).toBe('1 Okt 2026');
  });
});

describe('formatMoney', () => {
  it('groups thousands with commas and hides .00', () => {
    expect(formatMoney(20000)).toBe('Rp 20,000');
    expect(formatMoney(1250000)).toBe('Rp 1,250,000');
    expect(formatMoney(0)).toBe('Rp 0');
    expect(formatMoney(20000.0)).toBe('Rp 20,000');
  });

  it('shows two decimals when the amount has them', () => {
    expect(formatMoney(20000.5)).toBe('Rp 20,000.50');
    expect(formatMoney(1500.75)).toBe('Rp 1,500.75');
    expect(formatMoney(0.05)).toBe('Rp 0.05');
  });

  it('keeps the minus sign', () => {
    expect(formatMoney(-14000)).toBe('-Rp 14,000');
  });
});
