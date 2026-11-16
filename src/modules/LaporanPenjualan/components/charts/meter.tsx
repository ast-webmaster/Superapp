import { Animated, View } from 'react-native';

import { colors, radiusPill } from '@/shared/theme/tokens';

import { useReveal } from './use-reveal';

export interface MeterProps {
  /** Share of the target reached, 0–100 and beyond; the bar stops at full. */
  percentage: number;
  /** Where the bar should be by now, 0–100: drawn as a thin tick. */
  expected?: number | null;
}

/**
 * How much of a target is reached, as a soft rounded bar that grows in. Decorative: the card
 * beside it states the percentage in text, so screen readers skip it.
 */
export function Meter({ percentage, expected }: MeterProps) {
  const fill = Math.min(Math.max(percentage, 0), 100);
  const progress = useReveal(fill, { layout: true });

  return (
    <View aria-hidden className="h-4 justify-center">
      <View className="h-2 overflow-hidden rounded-pill bg-primary-soft">
        <Animated.View
          style={{
            height: '100%',
            borderRadius: radiusPill,
            backgroundColor: colors.primary,
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${fill}%`] }),
          }}
        />
      </View>
      {expected != null ? (
        <View
          className="absolute h-4 w-0.5 rounded-pill bg-ink"
          style={{ left: `${Math.min(Math.max(expected, 0), 100)}%` }}
        />
      ) : null}
    </View>
  );
}
