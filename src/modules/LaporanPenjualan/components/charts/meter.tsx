import { clsx } from 'clsx';
import { Animated, View } from 'react-native';

import { colors, radiusPill, type ColorToken } from '@/shared/theme/tokens';

import { useReveal } from './use-reveal';

export interface MeterProps {
  /** Share of the target reached, 0–100 and beyond; the bar stops at full. */
  percentage: number;
  /** The color of the bar. Defaults to `primary`. */
  fill?: ColorToken;
  /** For the `ink` market card: a dark track. */
  dark?: boolean;
}

/**
 * How much of a target is reached, as a soft rounded bar that grows in. Decorative: the card
 * beside it states the percentage in text, so screen readers skip it.
 */
export function Meter({ percentage, fill: fillColor = 'primary', dark }: MeterProps) {
  const fill = Math.min(Math.max(percentage, 0), 100);
  const progress = useReveal(fill, { layout: true });

  return (
    <View aria-hidden className="h-4 justify-center">
      <View
        className={clsx(
          'h-2 overflow-hidden rounded-pill',
          dark ? 'bg-ink-raised' : 'bg-primary-soft',
        )}>
        <Animated.View
          style={{
            height: '100%',
            borderRadius: radiusPill,
            backgroundColor: colors[fillColor],
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${fill}%`] }),
          }}
        />
      </View>
    </View>
  );
}
