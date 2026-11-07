import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useAuthStatus } from '@/core/auth';
import { colors } from '@/shared/theme/tokens';

import {
  CIRCLE_START_MS,
  PULSE_CYCLE_MS,
  PULSE_SCALE,
  REDUCED_FADE_MS,
  SPLASH_BG,
  ZOOM_DURATION_MS,
  ZOOM_SYMBOL_SCALE,
} from './splash-config';
import { SplashSymbol } from './splash-symbol';
import { useSplashSequence } from './use-splash-sequence';

/**
 * Continues the native splash screen: the symbol pulses while the session is restored, then
 * zooms and a white circle grows over the screen before the overlay unmounts. The first
 * frame matches the native splash, so the hand-over does not flicker.
 */
export function AnimatedSplashOverlay() {
  const authStatus = useAuthStatus();
  const reduceMotion = useReducedMotion();
  const { phase, covered, start } = useSplashSequence(authStatus, reduceMotion);
  const { width, height } = useWindowDimensions();

  const symbolScale = useSharedValue(1);
  const circleScale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (phase === 'pulsing' && !reduceMotion) {
      const half = { duration: PULSE_CYCLE_MS / 2, easing: Easing.inOut(Easing.sin) };
      symbolScale.set(
        withRepeat(withSequence(withTiming(PULSE_SCALE, half), withTiming(1, half)), -1),
      );
    } else if (phase === 'zooming') {
      if (reduceMotion) {
        opacity.set(withTiming(0, { duration: REDUCED_FADE_MS }));
      } else {
        // withTiming continues from the current value, so a late start never jumps.
        symbolScale.set(
          withTiming(ZOOM_SYMBOL_SCALE, {
            duration: ZOOM_DURATION_MS,
            easing: Easing.in(Easing.quad),
          }),
        );
        circleScale.set(
          withDelay(
            CIRCLE_START_MS,
            withTiming(1, {
              duration: ZOOM_DURATION_MS - CIRCLE_START_MS,
              easing: Easing.inOut(Easing.cubic),
            }),
          ),
        );
      }
    }
  }, [phase, reduceMotion, symbolScale, circleScale, opacity]);

  const symbolStyle = useAnimatedStyle(() => ({ transform: [{ scale: symbolScale.get() }] }));
  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: circleScale.get() }] }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  if (phase === 'done') return null;

  // The circle is centred like the symbol; its final radius reaches past the screen corners.
  const circleSize = Math.hypot(width, height) + 8;

  return (
    <Animated.View
      onLayout={() => {
        // Hide the native splash only once this identical frame is on screen.
        SplashScreen.hideAsync().finally(start);
      }}
      style={[styles.overlay, overlayStyle]}>
      {/* Light icons on black; `auto` follows the destination (dark on a light screen). */}
      <StatusBar style={covered ? 'auto' : 'light'} />
      <Animated.View
        style={[
          styles.circle,
          { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
          circleStyle,
        ]}
      />
      {/* Animated.View takes `style`, not `className`; the symbol sits above the circle. */}
      <View pointerEvents="none" style={styles.center}>
        <Animated.View style={symbolStyle}>
          <SplashSymbol />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SPLASH_BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: { backgroundColor: colors.surface },
});
