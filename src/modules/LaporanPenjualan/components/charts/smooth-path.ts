export type Point = { x: number; y: number };

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Tangent at each point for a monotone cubic curve (Fritsch–Carlson): the curve stays smooth but
 * never overshoots between two points, so a line of sales never dips below zero or bulges above
 * a peak that did not happen.
 */
function tangents(points: Point[]): number[] {
  const slopes = points
    .slice(1)
    .map((point, index) => (point.y - points[index]!.y) / (point.x - points[index]!.x || 1));
  const result = points.map((_, index) => {
    if (index === 0) return slopes[0]!;
    if (index === points.length - 1) return slopes[index - 1]!;
    const before = slopes[index - 1]!;
    const after = slopes[index]!;
    return before * after <= 0 ? 0 : (before + after) / 2;
  });

  slopes.forEach((slope, index) => {
    if (slope === 0) {
      result[index] = 0;
      result[index + 1] = 0;
      return;
    }
    const a = result[index]! / slope;
    const b = result[index + 1]! / slope;
    const size = a * a + b * b;
    if (size > 9) {
      const scale = 3 / Math.sqrt(size);
      result[index] = scale * a * slope;
      result[index + 1] = scale * b * slope;
    }
  });
  return result;
}

/** An SVG path through every point, as one smooth curve. */
export function smoothLine(points: Point[]): string {
  const [first] = points;
  if (!first) return '';
  if (points.length === 1) return `M${round(first.x)},${round(first.y)}`;

  const slope = tangents(points);
  let path = `M${round(first.x)},${round(first.y)}`;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]!;
    const to = points[index]!;
    const third = (to.x - from.x) / 3;
    path +=
      `C${round(from.x + third)},${round(from.y + slope[index - 1]! * third)}` +
      ` ${round(to.x - third)},${round(to.y - slope[index]! * third)}` +
      ` ${round(to.x)},${round(to.y)}`;
  }
  return path;
}

/** The same curve, closed down to `baseline`, for the soft fill under the line. */
export function smoothArea(points: Point[], baseline: number): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last || points.length < 2) return '';
  return `${smoothLine(points)}L${round(last.x)},${round(baseline)}L${round(first.x)},${round(baseline)}Z`;
}
