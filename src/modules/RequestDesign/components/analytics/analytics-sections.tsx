import { View } from 'react-native';

import { AppText, Badge } from '@/shared/ui';

import type { AnalyticsDesigner, AnalyticsSeries } from '../../types';
import { achievementTone, formatPoints } from './period';

const clamp = (value: number) => Math.min(Math.max(value, 0), 100);

/** A soft bar of how much of the target is reached. Decorative: the card states the figures in text. */
function TargetBar({ percentage }: { percentage: number }) {
  return (
    <View aria-hidden className="h-2 overflow-hidden rounded-pill bg-primary-soft">
      <View style={{ width: `${clamp(percentage)}%` }} className="h-full rounded-pill bg-primary" />
    </View>
  );
}

/** A label over a figure, for the small facts inside a card. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1 gap-1">
      <AppText variant="label" tone="muted" numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="body-strong" numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </AppText>
    </View>
  );
}

export function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <View className="gap-1 pt-2">
      <AppText variant="title" role="heading">
        {title}
      </AppText>
      {note ? (
        <AppText variant="caption" tone="muted">
          {note}
        </AppText>
      ) : null}
    </View>
  );
}

/** One designer's points against the target for the month. */
export function DesignerCard({ designer }: { designer: AnalyticsDesigner }) {
  return (
    <View className="gap-4 rounded-xl shadow-card bg-surface p-4">
      <View className="flex-row items-center justify-between gap-3">
        <AppText variant="caption-strong" numberOfLines={1} className="min-w-0 flex-1">
          {designer.name}
        </AppText>
        <Badge
          size="sm"
          tone={achievementTone(designer.target_achieved)}
          label={`${formatPoints(designer.target_achieved)}% of target`}
        />
      </View>
      <TargetBar percentage={designer.target_achieved} />
      <View className="flex-row gap-3">
        <Stat label="Points" value={formatPoints(designer.count)} />
        <Stat label="Target" value={formatPoints(designer.target)} />
        <Stat label="Days" value={String(designer.days)} />
      </View>
    </View>
  );
}

const BAR_HEIGHT = 72;

/** One designer's points in each of the last months, as bars scaled to the highest value on screen. */
export function TrendCard({
  series,
  months,
  max,
}: {
  series: AnalyticsSeries;
  months: readonly string[];
  /** The highest value of every series, so the bars of two designers compare. */
  max: number;
}) {
  return (
    <View className="gap-3 rounded-xl shadow-card bg-surface p-4">
      <AppText variant="caption-strong" numberOfLines={1}>
        {series.name}
      </AppText>
      <View className="flex-row gap-3">
        {months.map((month, index) => {
          const value = series.data[index] ?? 0;
          return (
            <View
              key={month}
              className="min-w-0 flex-1 items-center gap-1"
              accessible
              aria-label={`${month}: ${formatPoints(value)} points`}>
              <AppText variant="label" style={{ fontVariant: ['tabular-nums'] }} numberOfLines={1}>
                {formatPoints(value)}
              </AppText>
              <View style={{ height: BAR_HEIGHT }} className="w-full justify-end" aria-hidden>
                <View
                  style={{
                    height: max > 0 ? Math.max((value / max) * BAR_HEIGHT, value > 0 ? 4 : 0) : 0,
                  }}
                  className="w-full rounded-md bg-primary"
                />
              </View>
              <AppText variant="label" tone="muted" numberOfLines={1}>
                {month.split(' ')[0]?.slice(0, 3)}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}
