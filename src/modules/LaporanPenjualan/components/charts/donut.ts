import type { ColorToken } from '@/shared/theme/tokens';

import type { BarItem } from './bar-list';

/** The olive ramp of a ranking, largest first. Everything after it shares one neutral gray. */
const RAMP: readonly ColorToken[] = ['chart-first', 'chart-second', 'chart-third', 'chart-fourth'];
const REST: ColorToken = 'control-off';

export type ShareItem = BarItem & { color: ColorToken; percentage: number };

export type Slice = { key: string; label: string; color: ColorToken; percentage: number };

/** "<1%" rather than a "0%" for a branch that did sell something. */
export function formatShare(percentage: number): string {
  return percentage > 0 && percentage < 1 ? '<1%' : `${Math.round(percentage)}%`;
}

/** Largest first, each with its color and its part of the total. Returns count as nothing sold. */
export function rankShares(items: BarItem[]): ShareItem[] {
  const total = items.reduce((sum, item) => sum + Math.max(item.value, 0), 0);
  return [...items]
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item,
      color: RAMP[index] ?? REST,
      percentage: total > 0 ? (Math.max(item.value, 0) / total) * 100 : 0,
    }));
}

/** The donut's slices: the largest ones by name, the rest together as "Others". */
export function donutSlices(ranked: ShareItem[]): Slice[] {
  // A single leftover keeps its name: "Others" would hide one branch behind a vaguer word.
  const named = ranked.length > RAMP.length + 1 ? RAMP.length : ranked.length;
  const rest = ranked.slice(named);
  const slices: Slice[] = ranked.slice(0, named);
  if (rest.length > 0) {
    slices.push({
      key: 'others',
      label: 'Others',
      color: REST,
      percentage: rest.reduce((sum, item) => sum + item.percentage, 0),
    });
  }
  return slices.filter((slice) => slice.percentage > 0);
}

/** The smallest part of the ring a slice is drawn with, so its line has somewhere to start. */
const MIN_DRAWN = 6;
/** How far from the bottom the largest slice's line starts, toward the side of its label. */
const LARGEST_LEAN = 0.7;

export type PlacedSlice = {
  slice: Slice;
  /** Radians clockwise from the top. */
  from: number;
  to: number;
  /** Where its line leaves the ring. */
  anchor: number;
  right: boolean;
};

/**
 * Turns the ring so the largest slice sits at the bottom and the others meet at the top, where they
 * split between the left and right labels. The largest one's label goes to the side with fewer.
 * Very small slices are drawn a little wider than their share; their labels still say the share.
 */
export function placeSlices(slices: Slice[]): PlacedSlice[] {
  const drawn = slices.map((slice) => Math.max(slice.percentage, MIN_DRAWN));
  const total = drawn.reduce((sum, value) => sum + value, 0);
  const angle = (value: number) => (value / total) * Math.PI * 2;
  const largest = drawn.indexOf(Math.max(...drawn));
  const before = (index: number) => drawn.slice(0, index).reduce((sum, value) => sum + value, 0);
  const turn = Math.PI - angle(before(largest) + (drawn[largest] ?? 0) / 2);

  const placed = slices.map((slice, index) => {
    const from = turn + angle(before(index));
    const to = turn + angle(before(index + 1));
    const anchor = (from + to) / 2;
    return { slice, from, to, anchor, right: Math.sin(anchor) >= -1e-6 };
  });

  const main = placed[largest];
  if (main) {
    const others = placed.filter((part) => part !== main);
    main.right = others.filter((part) => part.right).length * 2 <= others.length;
    // Never past the slice's own edge.
    const lean = Math.min(LARGEST_LEAN, (main.to - main.from) / 2 - 0.1);
    main.anchor = Math.PI + (main.right ? -lean : lean);
  }
  return placed;
}

/** A point on a circle, with the angle in radians clockwise from the top. */
export function polar(cx: number, cy: number, radius: number, angle: number) {
  return { x: cx + radius * Math.sin(angle), y: cy - radius * Math.cos(angle) };
}

/**
 * One slice of a ring. It is drawn `corner` inside its true edges, so a stroke of twice that width
 * in the same color gives it rounded corners. `gap` is the space left between two slices.
 */
export function sectorPath(options: {
  cx: number;
  cy: number;
  outer: number;
  inner: number;
  from: number;
  to: number;
  corner: number;
  gap: number;
}): string {
  const { cx, cy, from, to, corner, gap } = options;
  const outer = options.outer - corner;
  const inner = options.inner + corner;
  const middle = (from + to) / 2;
  // Never past the middle: a very thin slice becomes a sliver instead of turning inside out.
  // A whole ring is not pulled in, so its two ends meet without a notch.
  const whole = to - from >= Math.PI * 2 - 0.001;
  const half = (radius: number) =>
    whole ? Math.PI : Math.max((to - from) / 2 - (corner + gap / 2) / radius, 0.001);
  const o = half(outer);
  const i = half(inner);
  // An arc of a full turn starts where it ends and draws nothing, so stop just short of it.
  const limit = Math.PI - 0.001;
  const a = polar(cx, cy, outer, middle - Math.min(o, limit));
  const b = polar(cx, cy, outer, middle + Math.min(o, limit));
  const d = polar(cx, cy, inner, middle + Math.min(i, limit));
  const e = polar(cx, cy, inner, middle - Math.min(i, limit));
  const large = (value: number) => (value * 2 > Math.PI ? 1 : 0);

  return [
    `M ${a.x} ${a.y}`,
    `A ${outer} ${outer} 0 ${large(o)} 1 ${b.x} ${b.y}`,
    `L ${d.x} ${d.y}`,
    `A ${inner} ${inner} 0 ${large(i)} 0 ${e.x} ${e.y}`,
    'Z',
  ].join(' ');
}

/**
 * Moves labels of one side apart until none overlap, staying between `min` and `max`. Takes the
 * wanted positions and returns the new ones in the same order.
 */
export function spreadLabels(wanted: number[], spacing: number, min: number, max: number) {
  const order = wanted.map((y, index) => ({ y, index })).sort((a, b) => a.y - b.y);
  let floor = min;
  for (const label of order) {
    label.y = Math.max(label.y, floor);
    floor = label.y + spacing;
  }
  let ceiling = max;
  for (const label of [...order].reverse()) {
    label.y = Math.min(label.y, ceiling);
    ceiling = label.y - spacing;
  }
  return order.sort((a, b) => a.index - b.index).map((label) => label.y);
}
