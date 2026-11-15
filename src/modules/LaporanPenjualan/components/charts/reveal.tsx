import type { ReactNode } from 'react';
import { Animated } from 'react-native';

import { useReveal } from './use-reveal';

/** Fades its content in while it rises a few pixels: the soft entrance every chart shares. */
export function Reveal({ trigger, children }: { trigger?: unknown; children: ReactNode }) {
  const progress = useReveal(trigger);

  // `Animated.View` takes `style` only; the content brings its own layout classes.
  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
        ],
      }}>
      {children}
    </Animated.View>
  );
}
