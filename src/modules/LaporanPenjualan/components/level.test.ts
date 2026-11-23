import { formatPercent, levelBadge } from './level';

it('names each level and keeps an unknown one readable', () => {
  expect(levelBadge('below')).toEqual({ label: 'Below target', tone: 'danger' });
  expect(levelBadge('achieved').tone).toBe('success');
  expect(levelBadge('EXCEEDED')).toEqual({ label: 'Exceeded', tone: 'neutral' });
});

it('rounds the percentage', () => {
  expect(formatPercent(64.6)).toBe('65%');
  expect(formatPercent(100)).toBe('100%');
});
