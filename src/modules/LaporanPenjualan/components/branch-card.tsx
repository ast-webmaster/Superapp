import { View } from 'react-native';

import type { ColorToken } from '@/shared/theme/tokens';
import { AppText, Icon, type AppTextProps } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

import type { BranchAchievement } from '../types';
import { Amount } from './amount';
import { Meter } from './charts/meter';
import { DeltaChip } from './delta-chip';
import { describeBalance, levelBadge, levelTrend, type Trend } from './level';

/** The bar follows how the branch is doing; a branch level with its target stays black. */
const meterFill: Record<Trend, ColorToken> = {
  gain: 'success',
  flat: 'primary',
  loss: 'danger',
};

/** The level word under the bar: the dot and the word share one color, and the word says it alone. */
const statusLook = {
  neutral: { dot: 'bg-ink-muted', text: 'muted' },
  info: { dot: 'bg-ink', text: 'ink' },
  blue: { dot: 'bg-blue', text: 'blue' },
  success: { dot: 'bg-success', text: 'success' },
  danger: { dot: 'bg-danger', text: 'danger' },
  warning: { dot: 'bg-warning', text: 'warning' },
} as const satisfies Record<string, { dot: string; text: AppTextProps['tone'] }>;

/** One branch of a group: its sales against its own monthly target. */
export function BranchCard({ branch }: { branch: BranchAchievement }) {
  const { achievement, target } = branch;
  const level = levelBadge(achievement.level);
  const look = statusLook[level.tone ?? 'neutral'];

  return (
    <View accessible className="gap-4 rounded-xl border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <View className="size-10 items-center justify-center rounded-md bg-surface-gray">
            <Icon name="building" size={20} />
          </View>
          <AppText variant="module-title" numberOfLines={2} className="min-w-0 flex-1">
            {branch.branch}
          </AppText>
        </View>
        <DeltaChip percentage={achievement.percentage} level={achievement.level} />
      </View>
      <View className="gap-1">
        <Amount
          value={achievement.value}
          variant="heading"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        />
        {/* An accent fill with `ink` text on it: the gold fails contrast under light text. */}
        <View className="min-h-6 self-start justify-center rounded-pill bg-accent px-2">
          <AppText variant="label" tone="ink" numberOfLines={1}>
            {`Target ${formatMoney(target.monthly_amount)}`}
          </AppText>
        </View>
      </View>
      <Meter percentage={achievement.percentage} fill={meterFill[levelTrend(achievement.level)]} />
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 shrink flex-row items-center gap-2">
          <View aria-hidden className={`size-2 rounded-pill ${look.dot}`} />
          <AppText variant="caption-strong" tone={look.text} numberOfLines={1}>
            {level.label}
          </AppText>
        </View>
        <AppText variant="caption" tone="muted" numberOfLines={1} className="shrink-0">
          {describeBalance(target.balance, formatMoney)}
        </AppText>
      </View>
    </View>
  );
}
