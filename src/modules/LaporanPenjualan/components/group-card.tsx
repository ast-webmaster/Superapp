import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { focusRing, MorphLink } from '@/shared/ui';

import { laporanPenjualanRoutes } from '../navigation/routes';
import type { GroupSummary } from '../types';
import { Sparkline } from './charts/sparkline';
import { formatPercent, levelBadge, levelTrend } from './level';
import { groupSeries } from './series';
import { TickerFigures, trendLooks } from './ticker-tile';

export interface GroupCardProps {
  group: GroupSummary;
}

/**
 * One group's month so far, as a white ticker tile for a two-column grid: its name, the amount, the
 * share of the target with an arrow, and its sales per day (only days with transactions) as an area
 * along the bottom edge. Opens the group's daily, weekly and branch detail.
 */
export function GroupCard({ group }: GroupCardProps) {
  const { achievement } = group;
  const look = trendLooks[levelTrend(achievement.level)];
  const level = levelBadge(achievement.level).label;
  // Read from the summary already on screen: no request per card (see data-management.md).
  const values = groupSeries(group);

  return (
    <MorphLink href={laporanPenjualanRoutes.group(group.group) as Href}>
      <Pressable
        role="button"
        aria-label={`Open ${group.group}, ${formatPercent(achievement.percentage)} of target, ${level}`}
        className={clsx(
          'grow justify-between gap-3 overflow-hidden rounded-xl bg-surface shadow-card active:bg-surface-gray',
          focusRing,
        )}>
        <View className="px-3 pt-3">
          <TickerFigures name={group.group} achievement={achievement} />
        </View>
        <Sparkline values={values} color={look.color} height={64} />
      </Pressable>
    </MorphLink>
  );
}
