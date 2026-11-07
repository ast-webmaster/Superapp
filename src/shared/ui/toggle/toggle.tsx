import { clsx } from 'clsx';
import { useEffect, useState, type ComponentRef, type Ref } from 'react';
import { Animated, Platform, Pressable, View } from 'react-native';

import { useControllableState } from '@/shared/hooks/use-controllable-state';
import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';

import { focusRing } from '../focus';

const KNOB_TRAVEL = 24;
const DURATION = 150;

export interface ToggleProps {
  /** What the switch controls, for screen readers. */
  label: string;
  value?: boolean;
  defaultValue?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
  ref?: Ref<ComponentRef<typeof Pressable>>;
}

export function Toggle({
  label,
  value,
  defaultValue = false,
  onValueChange,
  disabled = false,
  className,
  ref,
}: ToggleProps) {
  const [on, setOn] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const reducedMotion = useReducedMotion();
  const [offset] = useState(() => new Animated.Value(on ? KNOB_TRAVEL : 0));

  useEffect(() => {
    Animated.timing(offset, {
      toValue: on ? KNOB_TRAVEL : 0,
      duration: reducedMotion ? 0 : DURATION,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [offset, on, reducedMotion]);

  return (
    // The press area is 48 tall; the visible track inside it is 32.
    <Pressable
      ref={ref}
      role="switch"
      aria-label={label}
      aria-checked={on}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={() => setOn(!on)}
      className={clsx(
        'min-h-touch justify-center self-start rounded-pill',
        disabled && 'opacity-50',
        focusRing,
        className,
      )}>
      <View
        className={clsx(
          'h-8 w-14 justify-center rounded-pill px-1',
          on ? 'bg-primary' : 'bg-control-off',
        )}>
        <Animated.View style={{ transform: [{ translateX: offset }] }}>
          <View className="size-6 rounded-pill bg-on-primary" />
        </Animated.View>
      </View>
    </Pressable>
  );
}
