import { daysInRange, rangesOverlap } from './dates';

it('counts both the first and the last day', () => {
  expect(daysInRange('2026-11-24', '2026-11-25')).toBe(2);
  expect(daysInRange('2026-11-24', '2026-11-24')).toBe(1);
  expect(daysInRange('2026-11-28', '2026-12-02')).toBe(5);
});

it('counts nothing for a missing or backwards range', () => {
  expect(daysInRange(null, '2026-11-24')).toBe(0);
  expect(daysInRange('2026-11-25', '2026-11-24')).toBe(0);
});

it('treats a shared day as an overlap, even the edge one', () => {
  const a = { start: '2026-11-24', end: '2026-11-25' };
  expect(rangesOverlap(a, { start: '2026-11-25', end: '2026-11-26' })).toBe(true);
  expect(rangesOverlap(a, { start: '2026-11-26', end: '2026-11-27' })).toBe(false);
});
