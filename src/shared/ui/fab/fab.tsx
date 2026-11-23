import { clsx } from 'clsx';
import type { ComponentRef, Ref } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';

export interface FabProps extends Omit<PressableProps, 'children' | 'style'> {
  /** What it creates, for screen readers, such as "New price request". */
  label: string;
  icon?: IconName;
  className?: string;
  ref?: Ref<ComponentRef<typeof Pressable>>;
}

/**
 * The create button. It floats at the bottom of the screen, full width between the screen
 * margins, so make it the last child of `Screen`. Render it only when the user holds the
 * module's create permission.
 */
export function Fab({ label, icon = 'plus', className, ...props }: FabProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Pressable
      role="button"
      aria-label={label}
      className={clsx(
        'absolute right-5 left-5 min-h-control flex-row items-center justify-center gap-3 rounded-lg bg-primary px-6 shadow-card active:bg-primary-pressed',
        focusRing,
        className,
      )}
      style={{ bottom: bottom + 20 }}
      {...props}>
      <Icon name={icon} color="on-primary" />
      <AppText variant="button" tone="on-primary" numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}
