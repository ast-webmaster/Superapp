import { clsx } from 'clsx';
import { View } from 'react-native';

import type { ColorToken } from '@/shared/theme/tokens';
import { AppText, Icon, type AppTextProps, type IconName } from '@/shared/ui';

import type { AchievementLevel } from '../types';
import { formatPercent, levelTrend, type Trend } from './level';

type Look = { box: string; tone: AppTextProps['tone']; icon: ColorToken };

const looks: Record<Trend, Look> = {
  gain: { box: 'bg-success-bg', tone: 'success', icon: 'success' },
  flat: { box: 'bg-blue-soft', tone: 'blue', icon: 'blue' },
  loss: { box: 'bg-danger-bg', tone: 'danger', icon: 'danger' },
};

// The arrow says it without color: up when the target is met, down when it is not, level between.
const arrows: Record<Trend, IconName> = {
  gain: 'arrow-up',
  flat: 'arrow-right',
  loss: 'arrow-down',
};

export interface DeltaChipProps {
  percentage: number;
  level: AchievementLevel;
}

/** The share of the target reached, as a small up/down chip, like a price change. */
export function DeltaChip({ percentage, level }: DeltaChipProps) {
  const trend = levelTrend(level);
  const look = looks[trend];

  return (
    <View
      accessible
      aria-label={`${formatPercent(percentage)} of target`}
      className={clsx('min-h-7 flex-row items-center gap-1 self-start rounded-lg px-2', look.box)}>
      <Icon name={arrows[trend]} size={14} color={look.icon} />
      <AppText variant="caption-strong" tone={look.tone}>
        {formatPercent(percentage)}
      </AppText>
    </View>
  );
}
