import { View } from 'react-native';

import { AppText, Badge } from '@/shared/ui';
import { formatCompactMoney, formatDate } from '@/shared/utils/format';

import type { ActivityComparison, ActivityTrendMonth, DealerActivity } from '../types';
import { formatNumber, formatSignedPercent } from './number';
import { SectionTitle, Stat } from './section-title';

function growthBadge(growth: number | null) {
  if (growth === null) return { label: 'No earlier data', tone: 'neutral' } as const;
  if (growth > 0)
    return { label: formatSignedPercent(growth), tone: 'success', icon: 'arrow-up' } as const;
  if (growth < 0)
    return { label: formatSignedPercent(growth), tone: 'danger', icon: 'arrow-down' } as const;
  return { label: '0%', tone: 'neutral', icon: 'arrow-right' } as const;
}

function ComparisonCard({ title, data }: { title: string; data: ActivityComparison }) {
  const { active } = data;

  return (
    <View
      accessible
      aria-label={`${title}, ${active.current} active dealers against ${active.previous}, ${data.new} new, ${data.repeat} repeat, ${data.lost} lost`}
      className="gap-3 rounded-xl border border-border bg-surface p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 shrink gap-1">
          <AppText variant="module-title" role="heading">
            {title}
          </AppText>
          <AppText variant="caption" tone="muted">
            {`${data.current.label} against ${data.previous.label}`}
          </AppText>
        </View>
        <Badge size="sm" {...growthBadge(active.growth)} />
      </View>
      <View className="flex-row items-baseline gap-2">
        <AppText variant="display" style={{ fontVariant: ['tabular-nums'] }}>
          {formatNumber(active.current)}
        </AppText>
        <AppText variant="caption" tone="muted">
          {`active dealers, ${formatNumber(active.previous)} before`}
        </AppText>
      </View>
      <View className="flex-row gap-3">
        <Stat label="New" value={formatNumber(data.new)} />
        <Stat label="Repeat" value={formatNumber(data.repeat)} />
        <Stat label="Lost" value={formatNumber(data.lost)} />
      </View>
    </View>
  );
}

function TrendRow({ month, max }: { month: ActivityTrendMonth; max: number }) {
  const share = max > 0 ? (month.active_dealers / max) * 100 : 0;

  return (
    <View
      accessible
      aria-label={`${month.label}, ${month.active_dealers} active dealers, sales ${formatCompactMoney(month.sales)}`}
      className="gap-1">
      <View className="flex-row items-baseline justify-between gap-3">
        <AppText variant="caption">{month.label}</AppText>
        <AppText variant="caption-strong" style={{ fontVariant: ['tabular-nums'] }}>
          {`${formatNumber(month.active_dealers)} dealers`}
        </AppText>
      </View>
      <View aria-hidden className="h-2 overflow-hidden rounded-pill bg-surface-gray">
        <View style={{ width: `${share}%` }} className="h-full rounded-pill bg-primary" />
      </View>
      <AppText variant="caption" tone="muted">
        {month.sales_per_dealer === null
          ? `Sales ${formatCompactMoney(month.sales)}`
          : `Sales ${formatCompactMoney(month.sales)} · ${formatCompactMoney(month.sales_per_dealer)} per dealer`}
      </AppText>
    </View>
  );
}

/** Dealers with a transaction this month and quarter against the one before, and the monthly trend. */
export function ActivityView({ data }: { data: DealerActivity }) {
  // Newest month first, like every other list in the app.
  const trend = [...data.trend].reverse();
  const max = Math.max(0, ...trend.map((month) => month.active_dealers));

  return (
    <>
      <AppText variant="caption" tone="muted">
        {`As of ${formatDate(data.acuan.tanggal)}. An active dealer has at least one transaction in the period.`}
      </AppText>
      <ComparisonCard title="Month over month" data={data.mom} />
      <ComparisonCard title="Quarter over quarter" data={data.qoq} />
      <SectionTitle title="Monthly trend" note={`Last ${data.meta.trend_months} months.`} />
      <View className="gap-4 rounded-xl border border-border bg-surface p-4">
        {trend.map((month) => (
          <TrendRow key={month.key} month={month} max={max} />
        ))}
      </View>
    </>
  );
}
