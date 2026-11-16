import { clsx } from 'clsx';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

import { laporanPenjualanRoutes } from '../navigation/routes';
import type { GroupSummary } from '../types';
import { Meter } from './charts/meter';
import { formatPercent, levelBadge } from './level';

export interface GroupCardProps {
  group: GroupSummary;
  /** Where the bar should be by now, 0–100, or null when there is no fair expectation. */
  expected: number | null;
}

/** One group's month so far. Opens the group's daily, weekly and branch detail. */
export function GroupCard({ group, expected }: GroupCardProps) {
  const { achievement, target } = group;

  return (
    <Pressable
      role="button"
      aria-label={`Open ${group.group}, ${formatPercent(achievement.percentage)} of target`}
      onPress={() => router.push(laporanPenjualanRoutes.group(group.group) as Href)}
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
      <Meter percentage={achievement.percentage} expected={expected} />
      <View className="flex-row items-end justify-between gap-3">
        <View>
          <AppText variant="caption-strong">{formatMoney(achievement.value)}</AppText>
          <AppText variant="label" tone="muted">
            {`of ${formatMoney(target.monthly_amount)}`}
          </AppText>
        </View>
        <AppText variant="title">{formatPercent(achievement.percentage)}</AppText>
      </View>
    </Pressable>
  );
}
