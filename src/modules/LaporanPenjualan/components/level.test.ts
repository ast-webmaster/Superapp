import { describeBalance, formatPercent, levelBadge } from './level';

it('names each level and keeps an unknown one readable', () => {
  expect(levelBadge('below')).toEqual({ label: 'Below target', tone: 'danger' });
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
