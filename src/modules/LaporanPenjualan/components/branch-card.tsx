import { View } from 'react-native';

import { AppText, Badge } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

import type { BranchAchievement } from '../types';
import { Meter } from './charts/meter';
import { describeBalance, formatPercent, levelBadge } from './level';

/** One branch of a group: its sales against its own monthly target. */
export function BranchCard({ branch }: { branch: BranchAchievement }) {
  const { achievement, target } = branch;

  return (
    <View accessible className="gap-3 rounded-xl border border-border bg-surface p-4">
      <View className="flex-row items-start justify-between gap-3">
        <AppText variant="caption-strong" numberOfLines={2} className="min-w-0 shrink">
          {branch.branch}
        </AppText>
        <Badge size="sm" {...levelBadge(achievement.level)} />
      </View>
      <Meter percentage={achievement.percentage} />
      <View className="flex-row items-end justify-between gap-3">
        <View className="min-w-0 shrink">
          <AppText variant="caption-strong">{formatMoney(achievement.value)}</AppText>
          <AppText variant="label" tone="muted">
            {`of ${formatMoney(target.monthly_amount)}`}
          </AppText>
        </View>
        <AppText variant="title">{formatPercent(achievement.percentage)}</AppText>
      </View>
      <AppText variant="caption" tone="muted">
        {describeBalance(target.balance, formatMoney)}
      </AppText>
    </View>
  );
}
