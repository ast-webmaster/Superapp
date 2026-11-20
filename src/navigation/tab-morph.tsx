import { useIsFocused } from 'expo-router';
import { useEffect, type ComponentType } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';
import { MORPH_EASE, MORPH_MS } from '@/shared/motion/morph';

const FROM_SCALE = 0.98;

/**
 * Gives a tab screen a short morph each time its tab is picked: it fades up from 98%. Tabs are
 * switched many times a day, so it is 150ms and the other tab is already gone. The tab bar stays
 * put; only the content moves. With reduce motion it only fades.
 */
export function withTabMorph<Props extends object>(Screen: ComponentType<Props>) {
  function TabMorph(props: Props) {
    const focused = useIsFocused();
    const reducedMotion = useReducedMotion();
    const progress = useSharedValue(0);

    useEffect(() => {
      progress.set(focused ? withTiming(1, { duration: MORPH_MS.quick, easing: MORPH_EASE }) : 0);
    }, [focused, progress]);

    const style = useAnimatedStyle(() => {
      const value = progress.get();
      return {
        opacity: value,
        transform: reducedMotion ? [] : [{ scale: FROM_SCALE + (1 - FROM_SCALE) * value }],
      };
    });

    return (
      <Animated.View style={[{ flex: 1 }, style]}>
        <Screen {...props} />
      </Animated.View>
    );
  }

  TabMorph.displayName = `TabMorph(${Screen.displayName ?? Screen.name})`;
  return TabMorph;
}
