const STEPS = [1, 2, 4, 5, 6, 8, 10];

/**
 * The smallest round number at or above `value` (1, 2, 4, 5, 6, 8 times a power of ten), so the
 * top gridline and its half both read as clean amounts. Zero or less gives 1.
 */
export function niceMax(value: number): number {
  if (!(value > 0)) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = STEPS.find((candidate) => candidate * power >= value * (1 - 1e-9)) ?? 10;
  return step * power;
}

/** Gridline values for an axis from zero: bottom, middle and top. */
export function gridTicks(max: number): [number, number, number] {
  const top = niceMax(max);
  return [0, top / 2, top];
}
