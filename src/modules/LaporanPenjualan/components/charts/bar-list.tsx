import { Animated, View } from 'react-native';

import { colors, radiusPill } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui';
import { formatCompactMoney, formatMoney } from '@/shared/utils/format';

import { useReveal } from './use-reveal';

export type BarItem = { key: string; label: string; value: number };

function Bar({ item, max }: { item: BarItem; max: number }) {
  const share = max > 0 ? (Math.max(item.value, 0) / max) * 100 : 0;
  const progress = useReveal(share, { layout: true });

  return (
    <View accessible aria-label={`${item.label}, ${formatMoney(item.value)}`} className="gap-1">
      <View className="flex-row items-baseline justify-between gap-3">
        <AppText variant="caption" numberOfLines={1} className="min-w-0 shrink">
          {item.label}
        </AppText>
        <AppText variant="caption-strong">{formatCompactMoney(item.value)}</AppText>
      </View>
      <View className="h-2 overflow-hidden rounded-pill bg-surface-gray">
        <Animated.View
          style={{
            height: '100%',
            borderRadius: radiusPill,
            backgroundColor: colors.primary,
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${share}%`] }),
          }}
        />
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
