import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/shared/theme/tokens';
import { AppText, type AppTextProps } from '@/shared/ui';

import type { Achievement } from '../types';
import { Amount } from './amount';
import { formatPercent, levelTrend, type Trend } from './level';

/** Green when the target is met, blue when near, red when below: the `DeltaChip` colors. */
export const trendLooks = {
  gain: { color: 'success', arrow: 'M5 1 L10 9 H0 Z' },
  flat: { color: 'blue', arrow: 'M9 5 L1 10 V0 Z' },
  loss: { color: 'danger', arrow: 'M5 9 L0 1 H10 Z' },
} as const satisfies Record<Trend, { color: NonNullable<AppTextProps['tone']>; arrow: string }>;

/** The top of a ticker tile: the name, the amount, and the share of the target with an arrow. */
export function TickerFigures({ name, achievement }: { name: string; achievement: Achievement }) {
  const look = trendLooks[levelTrend(achievement.level)];

  return (
    <View className="gap-1">
      <AppText variant="label" tone="muted" numberOfLines={1}>
        {name}
      </AppText>
      <Amount
        value={achievement.value}
        variant="heading"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      />
      <View className="flex-row items-center gap-1">
        <Svg width={10} height={10} aria-hidden>
          <Path d={look.arrow} fill={colors[look.color]} />
        </Svg>
        <AppText variant="label" tone={look.color} numberOfLines={1}>
          {formatPercent(achievement.percentage)}
        </AppText>
      </View>
    </View>
  );
}

/** Tiles two to a row; a last one on its own keeps its half width. */
export function TileGrid<T>({
  items,
  keyOf,
  render,
}: {
  items: T[];
  keyOf: (item: T) => string;
  render: (item: T) => ReactNode;
}) {
  return Array.from({ length: Math.ceil(items.length / 2) }, (_, row) => (
    <View key={keyOf(items[row * 2]!)} className="flex-row gap-3">
      {[items[row * 2], items[row * 2 + 1]].map((item, column) => (
        <View key={item ? keyOf(item) : column} className="min-w-0 flex-1">
          {item ? render(item) : null}
        </View>
      ))}
    </View>
  ));
}
