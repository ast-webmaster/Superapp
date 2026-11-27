import { formatShortDate } from '@/shared/utils/format';

import type { DailyAmount, GroupSummary } from '../types';

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

const BARS = 7;

export type Bar = {
  key: string;
  /** Under the bar: the day of the month, or the week. */
  label: string;
  /** What screen readers call it. */
  name: string;
  value: number;
  /** The daily target was reached. */
  hit: boolean;
};

/** The last seven sales days. Without a daily target (0) no day counts as reached. */
export function dayBars(days: DailyAmount[], dailyTarget: number): Bar[] {
  return days.slice(-BARS).map(({ date, amount }) => ({
    key: date,
    label: String(Number(date.slice(8, 10))),
    name: formatShortDate(date),
    value: amount,
    hit: dailyTarget > 0 && amount >= dailyTarget,
  }));
}

/** The last seven weeks with sales, for a server that sends no days. A week has no daily target. */
export function weekBars(groups: Pick<GroupSummary, 'weekly'>[]): Bar[] {
  return weeklySeries(groups)
    .map((value, index) => ({
      key: `W-${index + 1}`,
      label: `W-${index + 1}`,
      name: `Week ${index + 1}`,
      value,
      hit: false,
    }))
    .slice(-BARS);
}
