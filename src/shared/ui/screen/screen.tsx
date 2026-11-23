import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, View } from 'react-native';

import { GroundGlow } from '../ground-glow/ground-glow';

const grounds = {
  ground: 'bg-ground',
  plain: 'bg-surface',
} as const;

export interface ScreenProps {
  children: ReactNode;
  /** `ground` is the soft gray with the peach glow; `plain` is flat white, for sign-in. */
  variant?: keyof typeof grounds;
  className?: string;
}

/**
 * The ground of every screen: `ground` (soft neutral gray) with a peach `ground-glow` fading out from
 * the top-right corner, or `plain` white. The content is held to phone width on wide displays.
 * It also lifts the content above the keyboard: `padding` on both platforms, because an edge-to-edge
 * Android window does not resize for it. With no keyboard the padding is 0.
 */
export function Screen({ children, variant = 'ground', className }: ScreenProps) {
  return (
    <View className={clsx('flex-1 items-center', grounds[variant])}>
      {variant === 'ground' ? <GroundGlow /> : null}
      <KeyboardAvoidingView
        behavior="padding"
        className={clsx('w-full max-w-phone flex-1', className)}>
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}
