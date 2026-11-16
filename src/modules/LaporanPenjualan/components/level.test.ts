import { currentPeriod, describeBalance, expectedShare, formatPercent, levelBadge } from './level';

it('names each level and keeps an unknown one readable', () => {
  expect(levelBadge('below')).toEqual({ label: 'Below target', tone: 'warning' });
  expect(levelBadge('achieved').tone).toBe('success');
  expect(levelBadge('EXCEEDED')).toEqual({ label: 'Exceeded', tone: 'neutral' });
});

it('rounds the percentage', () => {
  expect(formatPercent(64.6)).toBe('65%');
  expect(formatPercent(100)).toBe('100%');
});

it('says what is left or how far above', () => {
  const amount = (value: number) => String(value);
  expect(describeBalance(-700, amount)).toBe('700 to go');
  expect(describeBalance(0, amount)).toBe('0 above target');
});

describe('expectedShare', () => {
  it('spreads the target over the working days of the current month', () => {
    expect(expectedShare('2026-11', 5, 15, '2026-11')).toBe(25);
  });

  it('expects all of it once the month has ended, and nothing for a future one', () => {
    expect(expectedShare('2026-10', 5, 15, '2026-11')).toBe(100);
    expect(expectedShare('2026-12', 0, 20, '2026-11')).toBeNull();
  });

  it('treats more sales days than planned as the whole month', () => {
    expect(expectedShare('2026-11', 22, -2, '2026-11')).toBe(100);
    expect(expectedShare('2026-11', 0, 0, '2026-11')).toBeNull();
  });
});

it('writes the current month as YYYY-MM', () => {
  expect(currentPeriod(new Date(2026, 0, 31))).toBe('2026-01');
});
