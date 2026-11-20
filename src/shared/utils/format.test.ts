import {
  formatCompactMoney,
  formatDate,
  formatDateTime,
  formatMoney,
  formatMonth,
  formatRoles,
  formatShortDate,
  formatWeekday,
  formatWeekdayDate,
  sentenceCase,
} from './format';

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

describe('formatMonth', () => {
  it('writes the short Indonesian month and the year', () => {
    expect(formatMonth('2026-11')).toBe('Nov 2026');
    expect(formatMonth('2026-10')).toBe('Okt 2026');
    expect(formatMonth('2026-05')).toBe('Mei 2026');
  });

  it('returns anything that is not a year and month as it was', () => {
    expect(formatMonth('2026-13')).toBe('2026-13');
    expect(formatMonth('November 2026')).toBe('November 2026');
    expect(formatMonth('')).toBe('');
  });
});

describe('formatShortDate', () => {
  it('writes the day and month without the year', () => {
    expect(formatShortDate('2026-10-01')).toBe('1 Okt');
    expect(formatShortDate('2026-05-30 08:00:00')).toBe('30 Mei');
    expect(formatShortDate('not a date')).toBe('not a date');
  });
});

describe('formatCompactMoney', () => {
  it('shortens large amounts to one decimal', () => {
    expect(formatCompactMoney(950)).toBe('Rp 950');
    expect(formatCompactMoney(1500)).toBe('Rp 1.5K');
    expect(formatCompactMoney(1250000)).toBe('Rp 1.3M');
    expect(formatCompactMoney(12000000)).toBe('Rp 12M');
    expect(formatCompactMoney(250000000)).toBe('Rp 250M');
    expect(formatCompactMoney(3400000000)).toBe('Rp 3.4B');
    expect(formatCompactMoney(0)).toBe('Rp 0');
  });

  it('moves to the next unit instead of writing 1000', () => {
    expect(formatCompactMoney(999960)).toBe('Rp 1M');
  });

  it('keeps the minus sign', () => {
    expect(formatCompactMoney(-700000)).toBe('-Rp 700K');
  });
});

describe('formatWeekday', () => {
  it('names the day of the week', () => {
    expect(formatWeekday(new Date(2026, 10, 9))).toBe('Sen');
    expect(formatWeekday(new Date(2026, 4, 30))).toBe('Sab');
  });
});

describe('formatWeekdayDate', () => {
  it('writes the short weekday, day and month', () => {
    expect(formatWeekdayDate(new Date(2026, 10, 9))).toBe('Sen, 9 Nov');
    expect(formatWeekdayDate(new Date(2026, 4, 30))).toBe('Sab, 30 Mei');
  });
});

describe('sentenceCase', () => {
  it('lowers capitals and keeps the first letter up', () => {
    expect(sentenceCase('AWAITING')).toBe('Awaiting');
    expect(sentenceCase('PRODUCT MANAGER')).toBe('Product manager');
    expect(sentenceCase('')).toBe('');
  });
});

describe('formatRoles', () => {
  it('shows the first role and how many more', () => {
    expect(formatRoles(['Sales'])).toBe('Sales');
    expect(formatRoles(['Sales', 'Admin', 'HR'])).toBe('Sales +2');
    expect(formatRoles([])).toBeNull();
  });
});
