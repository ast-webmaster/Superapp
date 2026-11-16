import { smoothArea, smoothLine } from './smooth-path';

/** Every number in a path, in order. */
const numbers = (path: string) => (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

it('draws nothing without points and a single move for one point', () => {
  expect(smoothLine([])).toBe('');
  expect(smoothLine([{ x: 5, y: 10 }])).toBe('M5,10');
});

it('passes through every point', () => {
  const points = [
    { x: 0, y: 50 },
    { x: 10, y: 20 },
    { x: 20, y: 40 },
    { x: 30, y: 0 },
  ];
  const path = smoothLine(points);

  expect(path.startsWith('M0,50')).toBe(true);
  for (const point of points.slice(1)) expect(path).toContain(` ${point.x},${point.y}`);
});

it('never overshoots: every control point stays between its two points', () => {
  // A spike next to flat days is where a plain spline would dip below the baseline.
  const points = [
    { x: 0, y: 100 },
    { x: 10, y: 100 },
    { x: 20, y: 0 },
    { x: 30, y: 100 },
    { x: 40, y: 90 },
  ];
  const values = numbers(smoothLine(points)).slice(2);

  for (let segment = 0; segment < points.length - 1; segment += 1) {
    const [, y1, , y2] = values.slice(segment * 6, segment * 6 + 4);
    const low = Math.min(points[segment]!.y, points[segment + 1]!.y);
    const high = Math.max(points[segment]!.y, points[segment + 1]!.y);
    for (const y of [y1!, y2!]) {
      expect(y).toBeGreaterThanOrEqual(low);
      expect(y).toBeLessThanOrEqual(high);
    }
  }
});

it('keeps flat stretches flat', () => {
  expect(
    smoothLine([
      { x: 0, y: 30 },
      { x: 10, y: 30 },
    ]),
  ).toBe('M0,30C3.33,30 6.67,30 10,30');
});

it('closes the area down to the baseline', () => {
  expect(
    smoothArea(
      [
        { x: 0, y: 30 },
        { x: 10, y: 30 },
      ],
      100,
    ),
  ).toBe('M0,30C3.33,30 6.67,30 10,30L10,100L0,100Z');
  expect(smoothArea([{ x: 0, y: 1 }], 100)).toBe('');
});
