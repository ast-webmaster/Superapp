import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ActionBarProps {
  /** Usually an `Alert`, a row of `Button`s and a caption. A row is `flex-row gap-2`. */
  children: ReactNode;
  className?: string;
}

/**
 * The bar pinned to the bottom of a screen that has actions: straight on the `ground`, no card,
 * no hairline, with the safe area under it. In a row, the main `primary` action takes `flex-2`
 * and the others are `secondary` with `flex-1 px-2`. Reference: the Price Approval detail.
 */
export function ActionBar({ children, className }: ActionBarProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      className={clsx('gap-3 bg-ground px-5 pt-3', className)}
      style={{ paddingBottom: Math.max(bottom, 12) }}>
      {children}
    </View>
  );
}
