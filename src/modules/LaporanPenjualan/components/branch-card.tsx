import { View } from 'react-native';

import type { ColorToken } from '@/shared/theme/tokens';
import { AppText, Badge } from '@/shared/ui';

import type { BranchAchievement } from '../types';
import { Amount } from './amount';
import { Meter } from './charts/meter';
import { formatPercent, levelBadge, levelTrend, type Trend } from './level';

/** The bar follows how the branch is doing; a branch level with its target stays black. */
const meterFill: Record<Trend, ColorToken> = {
  gain: 'success',
  flat: 'primary',
  loss: 'danger',
};

/**
 * One branch of a group: its actual revenue, then the target and the share reached, the bar,
 * and the gap left to the target (or how far above it the branch is).
 */
export function BranchCard({ branch }: { branch: BranchAchievement }) {
  const { achievement, target } = branch;
  const behind = target.balance < 0;

  return (
    <View accessible className="gap-4 rounded-xl border border-border bg-surface p-4">
      <View className="flex-row items-start justify-between gap-3">
        <AppText variant="module-title" numberOfLines={2} className="min-w-0 flex-1">
          {branch.branch}
        </AppText>
        <Badge size="sm" {...levelBadge(achievement.level)} />
      </View>
      <View className="gap-1">
        <Amount
          value={achievement.value}
          variant="display"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        />
        <AppText variant="caption" tone="muted">
          Revenue aktual
        </AppText>
      </View>
      <View className="gap-3 border-t border-border pt-4">
        <View className="flex-row items-end justify-between gap-3">
          <View className="min-w-0 shrink gap-1">
            <AppText variant="caption" tone="muted">
              Target
            </AppText>
            <Amount value={target.monthly_amount} variant="body-strong" numberOfLines={1} />
          </View>
          <View className="shrink-0 items-end gap-1">
            <AppText variant="caption" tone="muted">
              Achievement
            </AppText>
            <AppText variant="body-strong">{formatPercent(achievement.percentage)}</AppText>
          </View>
        </View>
        <Meter
          percentage={achievement.percentage}
          fill={meterFill[levelTrend(achievement.level)]}
        />
        <View className="flex-row items-center justify-between gap-3">
          <AppText variant="caption" tone="muted">
            {behind ? 'Gap to target' : 'Above target'}
          </AppText>
          <Amount
            value={Math.abs(target.balance)}
            variant="body-strong"
            tone={behind ? 'danger' : 'success'}
            numberOfLines={1}
          />
        </View>
      </View>
    </View>
  );
}
