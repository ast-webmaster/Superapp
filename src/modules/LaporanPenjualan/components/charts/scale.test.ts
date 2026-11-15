import { gridTicks, niceMax } from './scale';

it('rounds up to a clean amount', () => {
  expect(niceMax(1300)).toBe(2000);
  expect(niceMax(3500000)).toBe(4000000);
  expect(niceMax(4100000)).toBe(5000000);
  expect(niceMax(8000)).toBe(8000);
  expect(niceMax(9100)).toBe(10000);
  expect(niceMax(0.3)).toBe(0.4);
});

it('gives 1 for an empty axis', () => {
  expect(niceMax(0)).toBe(1);
  expect(niceMax(-5)).toBe(1);
  expect(niceMax(Number.NaN)).toBe(1);
});

it('puts the middle gridline at half the top', () => {
  expect(gridTicks(1300)).toEqual([0, 1000, 2000]);
});
