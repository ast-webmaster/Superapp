import { formatMonth } from '@/shared/utils/format';

import type { ReportSummary } from '../types';
import { daysLeftBadge, HeroCard } from './hero-card';
import { dayBars, weekBars } from './series';

/** The period's headline: total sales against the total target of every group in scope. */
export function TotalCard({ summary }: { summary: ReportSummary }) {
  const { total } = summary;

  return (
    <HeroCard
      tone="primary"
      heading="Total sales"
      eyebrow={formatMonth(summary.period)}
      // The server counts the month's days once, so every group carries the same number.
      badge={daysLeftBadge(summary.groups[0]?.target.day_left ?? 0)}
      amount={total.achievement}
      target={total.target}
      percentage={total.percentage}
      level={total.level}
      bars={recentBars(summary)}
      stats={[
        { label: total.balance < 0 ? 'To go' : 'Above target', value: Math.abs(total.balance) },
        { label: 'Average per sales day', value: dailyAverage(summary) },
      ]}
    />
  );
}

/** Sales per day when the server sends them, else per week. */
function recentBars({ daily_totals, groups }: ReportSummary) {
  if (!daily_totals?.length) return weekBars(groups);
  // The total's daily target is every group's daily target together, like its sales.
  return dayBars(
    daily_totals,
    groups.reduce((sum, group) => sum + group.target.daily_amount, 0),
  );
}

/** Sales per sales day: what the whole period has made, over the days that had sales. */
function dailyAverage({ total, groups }: ReportSummary): number {
  const days = groups[0]?.weekly.reduce((sum, week) => sum + week.dates.length, 0) ?? 0;
  return days > 0 ? Math.round(total.achievement / days) : 0;
}
