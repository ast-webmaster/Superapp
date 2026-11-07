import { clsx } from 'clsx';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';

export interface LoadingProps {
  /** Read out by screen readers. */
  label?: string;
  className?: string;
}

/** Centered spinner. Pass `flex-1` in `className` to fill a screen. */
export function Loading({ label = 'Loading', className }: LoadingProps) {
  return (
    <View
      accessible
      role="progressbar"
      aria-label={label}
      aria-busy
      className={clsx('items-center justify-center p-5', className)}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
