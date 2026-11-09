import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { View } from 'react-native';

export interface ScreenProps {
  children: ReactNode;
  className?: string;
}

/** The ground of every screen: `ground` (soft lavender-gray), with the content held to phone width on wide displays. */
export function Screen({ children, className }: ScreenProps) {
  return (
    <View className="flex-1 items-center bg-ground">
      <View className={clsx('w-full max-w-phone flex-1', className)}>{children}</View>
    </View>
  );
}
