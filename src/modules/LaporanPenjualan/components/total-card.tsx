import { View } from 'react-native';

import { AppText, Badge } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

import type { ReportSummary } from '../types';
import { ProgressRing } from './charts/progress-ring';
import { Reveal } from './charts/reveal';
import { describeBalance, levelBadge } from './level';

/** The period's headline: total sales against the total target of every group in scope. */
export function TotalCard({ summary }: { summary: ReportSummary }) {
  const { total } = summary;

  return (
    <View className="gap-4 rounded-xl border border-border bg-surface p-4">
      <View className="flex-row items-center gap-4">
        <View className="min-w-0 flex-1 gap-1">
          <AppText variant="label" tone="muted">
            Total sales
          </AppText>
          <AppText variant="heading" role="heading">
            {formatMoney(total.achievement)}
          </AppText>
          <AppText variant="caption" tone="muted">
            {`Target ${formatMoney(total.target)}`}
          </AppText>
          <View className="flex-row pt-1">
            <Badge size="sm" {...levelBadge(total.level)} />
          </View>
        </View>
        <Reveal trigger={summary.period}>
          <ProgressRing percentage={total.percentage} />
        </Reveal>
      </View>
      <View role="separator" className="h-px bg-border" />
      <AppText variant="caption">{describeBalance(total.balance, formatMoney)}</AppText>
    </View>
  );
}
