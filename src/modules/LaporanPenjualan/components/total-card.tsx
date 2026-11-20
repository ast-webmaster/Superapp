import { formatMonth } from '@/shared/utils/format';

import type { ReportSummary } from '../types';
import { HeroCard } from './hero-card';
import { cumulative, weeklySeries } from './series';

/** The period's headline: total sales against the total target of every group in scope. */
export function TotalCard({ summary }: { summary: ReportSummary }) {
  const { total } = summary;

  return (
    <HeroCard
      eyebrow={`Total sales · ${formatMonth(summary.period)}`}
      amount={total.achievement}
      target={total.target}
      percentage={total.percentage}
      level={total.level}
      series={cumulative(runningSeries(summary))}
      stats={[
        { label: total.balance < 0 ? 'To go' : 'Above target', value: Math.abs(total.balance) },
        { label: 'Average per sales day', value: dailyAverage(summary) },
      ]}
    />
  );
}

/** Sales per day when the server sends them, else per week, for the sparkline. */
function runningSeries({ daily_totals, groups }: ReportSummary): number[] {
  return daily_totals?.length ? daily_totals.map((day) => day.amount) : weeklySeries(groups);
}

/** Sales per sales day: what the whole period has made, over the days that had sales. */
function dailyAverage({ total, groups }: ReportSummary): number {
  const days = groups[0]?.weekly.reduce((sum, week) => sum + week.dates.length, 0) ?? 0;
  return days > 0 ? Math.round(total.achievement / days) : 0;
}
