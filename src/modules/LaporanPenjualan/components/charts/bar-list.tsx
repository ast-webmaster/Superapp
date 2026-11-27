import { Animated, View } from 'react-native';

import { colors, radiusPill, type ColorToken } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

import { Amount } from '../amount';
import { useReveal } from './use-reveal';

export type BarItem = {
  key: string;
  label: string;
  value: number;
  /** Matches the row to its slice in a chart above: a strip beside it and its bar. */
  color?: ColorToken;
  /** Shown after the amount, such as "30%". */
  note?: string;
};

function Bar({ item, max }: { item: BarItem; max: number }) {
  const share = max > 0 ? (Math.max(item.value, 0) / max) * 100 : 0;
  const progress = useReveal(share, { layout: true });

  return (
    <View
      accessible
      aria-label={[item.label, formatMoney(item.value), item.note].filter(Boolean).join(', ')}
      className="flex-row gap-3">
      {/* As tall as the whole row, so the color ties the name and its bar together. */}
      {item.color ? (
        <View className="w-2 rounded-pill" style={{ backgroundColor: colors[item.color] }} />
      ) : null}
      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row items-baseline gap-3">
          <AppText variant="caption" numberOfLines={1} className="min-w-0 flex-1">
            {item.label}
          </AppText>
          <Amount value={item.value} variant="caption-strong" />
          {item.note ? (
            <AppText variant="caption-strong" className="w-10 text-right">
              {item.note}
            </AppText>
          ) : null}
        </View>
        <View className="h-2 overflow-hidden rounded-pill bg-surface-gray">
          <Animated.View
            style={{
              height: '100%',
              borderRadius: radiusPill,
              backgroundColor: colors[item.color ?? 'primary'],
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${share}%`] }),
            }}
          />
        </View>
      </View>
    </View>
  );
}

/**
 * A ranking as rows of soft bars, largest first, each as long as its share of the largest.
 * Names and values are text, so long names wrap nothing and every value stays readable.
 */
export function BarList({ items }: { items: BarItem[] }) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const max = sorted[0]?.value ?? 0;

  return (
    <View className="gap-4">
      {sorted.map((item) => (
        <Bar key={item.key} item={item} max={max} />
      ))}
    </View>
  );
}
