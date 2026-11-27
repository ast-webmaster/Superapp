import {
  donutSlices,
  formatShare,
  placeSlices,
  rankShares,
  sectorPath,
  spreadLabels,
} from './donut';

const items = (values: number[]) =>
  values.map((value, index) => ({ key: `b${index}`, label: `Branch ${index}`, value }));

describe('donut', () => {
  it('ranks largest first with each share of the total, ignoring returns', () => {
    const ranked = rankShares(items([25, -10, 75]));
    expect(ranked.map((item) => [item.key, item.percentage, item.color])).toEqual([
      ['b2', 75, 'chart-first'],
      ['b0', 25, 'chart-second'],
      ['b1', 0, 'chart-third'],
    ]);
  });

  it('folds everything after the fourth into Others, in the gray of its bars', () => {
    const ranked = rankShares(items([40, 20, 15, 10, 10, 5]));
    const slices = donutSlices(ranked);
    expect(slices.map((slice) => slice.label)).toEqual([
      'Branch 0',
      'Branch 1',
      'Branch 2',
      'Branch 3',
      'Others',
    ]);
    expect(slices[4]).toMatchObject({ percentage: 15, color: ranked[4]!.color });
  });

  it('keeps the name of a single fifth branch', () => {
    expect(donutSlices(rankShares(items([5, 4, 3, 2, 1])))[4]!.label).toBe('Branch 4');
  });

  it('has no slices when nothing was sold', () => {
    expect(donutSlices(rankShares(items([0, -3])))).toEqual([]);
  });

  it('never shows a sale as 0%', () => {
    expect(formatShare(0.4)).toBe('<1%');
    expect(formatShare(0)).toBe('0%');
    expect(formatShare(29.6)).toBe('30%');
  });

  it('draws a whole ring and a sliver without broken numbers', () => {
    const base = { cx: 100, cy: 100, outer: 80, inner: 52, corner: 5, gap: 4 };
    for (const to of [Math.PI * 2, 0.001]) {
      expect(sectorPath({ ...base, from: 0, to })).not.toContain('NaN');
    }
  });

  it('moves crowded labels apart and keeps them inside', () => {
    expect(spreadLabels([100, 102, 104], 40, 18, 206)).toEqual([100, 140, 180]);
    expect(spreadLabels([205, 200], 40, 18, 206)).toEqual([206, 166]);
  });

  it('splits the labels over both sides when one branch dominates', () => {
    for (const values of [
      [62, 15, 10, 8, 5],
      [90, 4, 3, 2, 1],
    ]) {
      const placed = placeSlices(donutSlices(rankShares(items(values))));
      const right = placed.filter((part) => part.right).length;
      expect([2, 3]).toContain(right);
      // The largest sits at the bottom, and its line starts inside it.
      expect((placed[0]!.from + placed[0]!.to) / 2).toBeCloseTo(Math.PI);
      expect(placed[0]!.anchor).toBeGreaterThan(placed[0]!.from);
      expect(placed[0]!.anchor).toBeLessThan(placed[0]!.to);
    }
  });
});
