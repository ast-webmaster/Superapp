import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, View, type LayoutChangeEvent } from 'react-native';

import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';
import { colors, radiusPill } from '@/shared/theme/tokens';

const SWEEP_MS = 1200;
/** The moving segment is this share of the track. */
const SEGMENT = 0.4;

export interface ProgressBarProps {
  /** Read out by screen readers, for example "Downloading report.pdf". */
  label: string;
  className?: string;
}

/**
 * A bar that keeps moving while work of unknown length runs, such as a download: the server
 * does not tell how many bytes are coming, so there is no percentage to show. With reduced
 * motion the segment stays still.
 */
export function ProgressBar({ label, className }: ProgressBarProps) {
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [position] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion || width === 0) return;
    const sweep = Animated.loop(
      Animated.timing(position, {
        toValue: 1,
        duration: SWEEP_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    sweep.start();
    return () => {
      sweep.stop();
      position.setValue(0);
    };
  }, [position, reducedMotion, width]);

  const segmentWidth = width * SEGMENT;
  const translateX = position.interpolate({
    inputRange: [0, 1],
    outputRange: [-segmentWidth, width],
  });

  return (
    <View
      accessible
      role="progressbar"
      aria-label={label}
      aria-busy
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      className={clsx('h-1.5 overflow-hidden rounded-pill bg-surface', className)}>
      {/* `Animated.View` takes `style` only, so it carries the size and colour itself. */}
      <Animated.View
        style={{
          width: segmentWidth,
          height: '100%',
          borderRadius: radiusPill,
          backgroundColor: colors.primary,
          transform: [{ translateX: reducedMotion ? 0 : translateX }],
        }}
      />
    </View>
  );
}
