import { clsx } from 'clsx';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Platform, View } from 'react-native';

import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';
import { colors } from '@/shared/theme/tokens';

const PULSE_MS = 800;
const PULSE_LOW = 0.45;

export interface SkeletonProps {
  /** Size and shape, such as `h-5 w-3/4 rounded-sm`. */
  className?: string;
}

/** One placeholder block that pulses. Decorative: wrap blocks in a `SkeletonGroup`. */
export function Skeleton({ className }: SkeletonProps) {
  const reducedMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reducedMotion) return;
    const useNativeDriver = Platform.OS !== 'web';
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: PULSE_LOW, duration: PULSE_MS, useNativeDriver }),
        Animated.timing(opacity, { toValue: 1, duration: PULSE_MS, useNativeDriver }),
      ]),
    );
    pulse.start();
    return () => {
      pulse.stop();
      opacity.setValue(1);
    };
  }, [opacity, reducedMotion]);

  // `Animated.View` takes `style` only, so a plain View carries the size and shape.
  return (
    <View className={clsx('overflow-hidden rounded-sm', className)}>
      <Animated.View style={{ flex: 1, opacity, backgroundColor: colors['surface-gray'] }} />
    </View>
  );
}

export interface SkeletonGroupProps {
  /** Read out by screen readers. */
  label?: string;
  className?: string;
  children: ReactNode;
}

/** Announces a set of `Skeleton` blocks as one loading state. */
export function SkeletonGroup({ label = 'Loading', className, children }: SkeletonGroupProps) {
  return (
    <View accessible role="progressbar" aria-label={label} aria-busy className={className}>
      {children}
    </View>
  );
}
