import type { GroupSummary } from '../types';

/**
 * Sales per week, summed over the given groups, oldest first. Weeks still to come (no sales yet)
 * are left off the end so a sparkline stops at today instead of falling to zero.
 */
export function weeklySeries(groups: Pick<GroupSummary, 'weekly'>[]): number[] {
  const length = Math.max(0, ...groups.map((group) => group.weekly.length));
  const sums = Array.from({ length }, (_, index) =>
    groups.reduce((sum, group) => sum + (group.weekly[index]?.value ?? 0), 0),
  );
  let end = sums.length;
  while (end > 0 && sums[end - 1] === 0) end -= 1;
  return sums.slice(0, end);
}

/**
 * What a group's sparkline plots: its sales per day with transactions when the summary carries
 * them, else its sales per week.
 */
export function groupSeries(group: Pick<GroupSummary, 'weekly' | 'daily_totals'>): number[] {
  return group.daily_totals?.length
    ? group.daily_totals.map((day) => day.amount)
    : weeklySeries([group]);
}

/** A running total that starts at 0: [3, 2, 5] -> [0, 3, 5, 10]. No values, no series. */
export function cumulative(values: number[]): number[] {
  if (values.length === 0) return [];
  let total = 0;
  return [0, ...values.map((value) => (total += value))];
}
