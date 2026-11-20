import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { ColorToken } from '@/shared/theme/tokens';
import { AppText, Badge, focusRing, MorphLink } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

import { laporanPenjualanRoutes } from '../navigation/routes';
import type { GroupSummary } from '../types';
import { Amount } from './amount';
import { Meter } from './charts/meter';
import { Sparkline } from './charts/sparkline';
import { DeltaChip } from './delta-chip';
import { formatPercent, levelBadge, levelTrend, type Trend } from './level';
import { groupSeries } from './series';

/** The line and bar of a ticker row on a white card. Flat is the brand blue. */
const trendColor: Record<Trend, ColorToken> = {
  gain: 'success',
  flat: 'primary',
  loss: 'danger',
};

export interface GroupCardProps {
  group: GroupSummary;
}

/**
 * One group's month so far, as a ticker row: its name and status, the amount against its target
 * with its sales per day (only days with transactions) as a sparkline, and the bar with the
 * share reached. Opens the group's
 * daily, weekly and branch detail.
 */
export function GroupCard({ group }: GroupCardProps) {
  const { achievement, target } = group;
  const color = trendColor[levelTrend(achievement.level)];
  // Read from the summary already on screen: no request per card (see data-management.md).
  const values = groupSeries(group);

  return (
    <MorphLink href={laporanPenjualanRoutes.group(group.group) as Href}>
      <Pressable
        role="button"
        aria-label={`Open ${group.group}, ${formatPercent(achievement.percentage)} of target`}
        className={clsx(
          'gap-3 rounded-xl border border-border bg-surface p-4 active:bg-surface-gray',
          focusRing,
        )}>
        <View className="flex-row items-start justify-between gap-3">
          <AppText variant="caption-strong" numberOfLines={2} className="min-w-0 shrink">
            {group.group}
          </AppText>
          <Badge size="sm" {...levelBadge(achievement.level)} />
        </View>
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 shrink gap-1">
            <Amount value={achievement.value} variant="title" numberOfLines={1} />
            {/* An accent fill with `ink` text on it: the gold fails contrast under light text. */}
            <View className="min-h-6 self-start justify-center rounded-pill bg-accent px-2">
              <AppText variant="label" tone="ink" numberOfLines={1}>
                {`Target ${formatMoney(target.monthly_amount)}`}
              </AppText>
            </View>
          </View>
          <Sparkline values={values} color={color} width={88} height={40} />
        </View>
        <View className="flex-row items-center gap-3">
          <View className="min-w-0 flex-1">
            <Meter percentage={achievement.percentage} fill={color} />
          </View>
          <DeltaChip percentage={achievement.percentage} level={achievement.level} />
        </View>
      </Pressable>
    </MorphLink>
  );
}
