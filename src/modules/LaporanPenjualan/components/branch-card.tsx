import { View } from 'react-native';

import { formatMoney } from '@/shared/utils/format';

import type { BranchAchievement } from '../types';
import { Amount } from './amount';
import { formatPercent, levelBadge } from './level';
import { TickerFigures } from './ticker-tile';

/**
 * One branch of a group, as a ticker tile without a chart: its name, revenue and the share of the
 * target, then the target itself (a branch has no screen of its own to show it).
 */
export function BranchCard({ branch }: { branch: BranchAchievement }) {
  const { achievement, target } = branch;

  return (
    <View
      accessible
      aria-label={`${branch.branch}, ${formatMoney(achievement.value)}, ${formatPercent(
        achievement.percentage,
      )} of target ${formatMoney(target.monthly_amount)}, ${levelBadge(achievement.level).label}`}
      className="grow justify-between gap-2 rounded-xl bg-surface p-3 shadow-card">
      <TickerFigures name={branch.branch} achievement={achievement} />
      <Amount
        prefix="Target"
        value={target.monthly_amount}
        variant="label"
        tone="muted"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      />
    </View>
  );
}
