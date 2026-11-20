import { FadeIn, Easing, Keyframe } from 'react-native-reanimated';

import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';

/**
 * The one curve behind every morph: a strong ease-out, so a surface answers the tap at once and
 * settles softly. React Native's own `Easing.bezier` takes it as `...MORPH_CURVE`.
 */
export const MORPH_CURVE = [0.23, 1, 0.32, 1] as const;
export const MORPH_EASE = Easing.bezier(...MORPH_CURVE);

/** A surface grows in from this scale, never from 0. */
const MORPH_FROM_SCALE = 0.96;

export const MORPH_MS = {
  /** Screen push and pop (iOS; Android uses its own fade). */
  screen: 250,
  /** A card, dialog or banner arriving. */
  surface: 220,
  /** A tab, or any change that happens many times a day, and the reduce motion fade. */
  quick: 150,
} as const;

/**
 * How every screen change looks: the old screen fades into the new one. Zoom morphs (`MorphLink`)
 * ride on top of this on iOS 18+. The edge swipe back stays, on the whole screen, because a fade
 * has no edge to grab. It is already gentle, so reduce motion needs no variant.
 */
export const morphScreenOptions = {
  animation: 'fade',
  animationDuration: MORPH_MS.screen,
  fullScreenGestureEnabled: true,
} as const;

const morphEntering = new Keyframe({
  from: { opacity: 0, transform: [{ scale: MORPH_FROM_SCALE }] },
  to: { opacity: 1, transform: [{ scale: 1 }], easing: MORPH_EASE },
}).duration(MORPH_MS.surface);

/** For a surface that appears: a dialog card, a banner. A plain fade with reduce motion. */
export function useMorphEntering() {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? FadeIn.duration(MORPH_MS.quick) : morphEntering;
}
