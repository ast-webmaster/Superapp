import { clsx } from 'clsx';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';
import { colors } from '@/shared/theme/tokens';

import { IconButton } from '../icon-button/icon-button';
import { AppText } from '../text/text';

/** Opening is a touch slower than closing, and neither overshoots. */
const OPEN = { duration: 300, easing: Easing.bezier(0.32, 0.72, 0, 1) } as const;
const CLOSE = { duration: 200, easing: Easing.bezier(0.23, 1, 0.32, 1) } as const;
/** With reduce motion the sheet and the scrim only fade. */
const FADE = { duration: 150, easing: Easing.bezier(0.23, 1, 0.32, 1) } as const;

/** The finger hands its velocity to these springs, so a flick carries on without a seam. */
const DISMISS_SPRING = { duration: 300, dampingRatio: 1, overshootClamping: true } as const;
const RETURN_SPRING = { duration: 300, dampingRatio: 0.8 } as const;

/** A drag closes the sheet when it would come to rest past this share of the sheet's height. */
const DISMISS_FRACTION = 0.4;

/** Where the sheet waits while it is closed or not laid out yet: below every screen height. */
const PARKED = Math.max(Dimensions.get('window').width, Dimensions.get('window').height);

const fill = { flex: 1 } as const;
const noop = () => {};
const scrim = { backgroundColor: colors.scrim };

// What the sheet is doing, derived from `visible` and from whether it has been measured yet.
const WAITING = 0;
const OPENING = 1;
const CLOSING = 2;

/** Where a flick of this velocity (points per second) would come to rest. Apple's decay form. */
function project(velocity: number, decelerationRate = 0.998) {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Past the top edge the sheet follows less and less of the finger instead of stopping dead. */
function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  'worklet';
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** 0 when the sheet is fully below the screen, 1 when it is fully open. */
function openness(translateY: number, height: number) {
  'worklet';
  return Math.min(1, Math.max(0, 1 - translateY / Math.max(height, 1)));
}

export interface SheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Fills the screen height under the safe area, so a short list does not shrink the sheet. */
  fullHeight?: boolean;
  /** Pinned under the scrolling content, such as an "Apply" button. */
  footer?: ReactNode;
  /** `alertdialog` for a sheet that asks the user to confirm an action. */
  role?: 'dialog' | 'alertdialog';
  /** The X in the header. Off for a sheet that asks a question, where the buttons answer it; the title then centers. */
  closeButton?: boolean;
  /**
   * Off while the sheet is busy (a request is running): the dim area, the back button and the drag
   * no longer close it. Defaults to on.
   */
  dismissible?: boolean;
}

/**
 * A bottom sheet over a dimmed screen. `visible` is the only source of truth: tapping the dim
 * area, the close button, the Android back button or dragging the header down all call `onClose`,
 * and the parent hides the sheet. The `Modal` stays mounted until the closing animation ends.
 */
export function Sheet({
  visible,
  title,
  onClose,
  children,
  footer,
  role = 'dialog',
  closeButton = true,
  dismissible = true,
  fullHeight = false,
}: SheetProps) {
  const { top, bottom } = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  // How far the sheet is pushed down from its open position. The scrim, the fade and the drag
  // all read this one value.
  const translateY = useSharedValue(PARKED);
  const height = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const shown = useSharedValue(visible);

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    shown.set(visible);
  }, [visible, shown]);

  /** Back to the parked state once the sheet is out of sight, then unmount the `Modal`. */
  function park() {
    'worklet';
    translateY.set(PARKED);
    height.set(0);
    scheduleOnRN(setMounted, false);
  }

  // Runs on the UI thread. The sheet opens only once it has been measured, so it travels exactly
  // its own height whatever its content.
  useAnimatedReaction(
    () => (shown.get() ? (height.get() > 0 ? OPENING : WAITING) : CLOSING),
    (state) => {
      if (state === OPENING) {
        if (translateY.get() > height.get()) translateY.set(height.get());
        translateY.set(withTiming(0, reducedMotion ? FADE : OPEN));
      } else if (state === CLOSING) {
        const closedAt = height.get();
        if (translateY.get() >= closedAt) {
          park();
        } else {
          // A reopen mid-close cancels this animation, so `finished` is false and the sheet stays.
          translateY.set(
            withTiming(closedAt, reducedMotion ? FADE : CLOSE, (finished) => {
              if (finished) park();
            }),
          );
        }
      }
    },
  );

  const pan = usePanGesture({
    enabled: !reducedMotion && dismissible,
    activeOffsetY: [-10, 10],
    onActivate: (event) => {
      // Grabbing the sheet mid-animation continues from where it is, and the finger's travel so
      // far is not counted, so the sheet does not jump when the drag begins.
      cancelAnimation(translateY);
      dragStart.set(translateY.get() - event.translationY);
    },
    onUpdate: (event) => {
      const next = dragStart.get() + event.translationY;
      translateY.set(next >= 0 ? next : rubberband(next, height.get()));
    },
    onDeactivate: (event) => {
      const closedAt = height.get();
      const projected = translateY.get() + project(event.velocityY);
      if (!event.canceled && projected > closedAt * DISMISS_FRACTION) {
        translateY.set(
          withSpring(closedAt, { ...DISMISS_SPRING, velocity: event.velocityY }, (finished) => {
            if (finished) scheduleOnRN(onClose);
          }),
        );
      } else {
        translateY.set(withSpring(0, { ...RETURN_SPRING, velocity: event.velocityY }));
        scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Light);
      }
    },
  });

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: openness(translateY.get(), height.get()),
  }));
  const sheetStyle = useAnimatedStyle(() =>
    reducedMotion
      ? { opacity: openness(translateY.get(), height.get()) }
      : { transform: [{ translateY: translateY.get() }] },
  );

  const measure = (event: LayoutChangeEvent) => height.set(event.nativeEvent.layout.height);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismissible ? onClose : noop}>
      {/* A `Modal` is its own native window on Android, so gestures need a root view inside it. */}
      <GestureHandlerRootView style={fill}>
        {/* `padding` on both platforms, so a field in the sheet stays above the keyboard: the sheet
            shrinks and its content scrolls. */}
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 items-center justify-end"
          style={{ paddingTop: top }}>
          <Animated.View style={[StyleSheet.absoluteFill, scrim, scrimStyle]} />
          <Pressable
            aria-hidden
            importantForAccessibility="no-hide-descendants"
            className="absolute inset-0"
            onPress={dismissible ? onClose : undefined}
          />
          <Animated.View
            onLayout={measure}
            style={[
              { width: '100%', maxHeight: '100%' },
              fullHeight && { height: '100%' },
              sheetStyle,
            ]}>
            <View
              role={role}
              aria-modal
              aria-label={title}
              className={clsx(
                'w-full max-w-phone self-center rounded-t-xl bg-surface',
                fullHeight ? 'flex-1' : 'shrink',
              )}
              style={{ paddingBottom: bottom }}>
              {/* Only the header drags the sheet, so the content below keeps scrolling. */}
              <GestureDetector gesture={pan}>
                <View>
                  {reducedMotion ? null : (
                    <View aria-hidden className="items-center pt-3">
                      <View className="h-1 w-10 rounded-pill bg-highlight" />
                    </View>
                  )}
                  <View className="flex-row items-center gap-3 px-5 py-4">
                    {closeButton ? <IconButton icon="x" label="Close" onPress={onClose} /> : null}
                    <AppText
                      variant="title"
                      role="heading"
                      className={clsx('min-w-0 flex-1', !closeButton && 'text-center')}>
                      {title}
                    </AppText>
                  </View>
                </View>
              </GestureDetector>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                className={fullHeight ? 'flex-1' : 'shrink'}
                contentContainerClassName="gap-4 px-5 pb-4">
                {children}
              </ScrollView>
              {footer ? <View className="px-5 pb-4 pt-2">{footer}</View> : null}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
