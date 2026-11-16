import { useEffect, useState } from 'react';
import { Animated, Easing, Platform } from 'react-native';

import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';

const DURATION_MS = 700;

/**
 * An animated value that eases from 0 to 1 when the chart appears and again whenever `trigger`
 * changes (a new period). With reduce motion on it sits at 1. `layout` animations (width) cannot
 * run on the native driver, so they ask for the JS one.
 */
export function useReveal(trigger: unknown, { layout = false } = {}) {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: !layout && Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion, trigger, layout]);

  return progress;
}
