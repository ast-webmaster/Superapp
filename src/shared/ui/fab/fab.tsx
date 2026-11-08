import { clsx } from 'clsx';
import type { ComponentRef, Ref } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';

export interface FabProps extends Omit<PressableProps, 'children' | 'style'> {
  /** What it creates, for screen readers, such as "New price request". */
  label: string;
  icon?: IconName;
  className?: string;
  ref?: Ref<ComponentRef<typeof Pressable>>;
}

/**
 * The create button. It floats at the bottom right of the screen, so make it the last child of
 * `Screen`. Render it only when the user holds the module's create permission.
 */
export function Fab({ label, icon = 'plus', className, ...props }: FabProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Pressable
      role="button"
      aria-label={label}
      className={clsx(
        'absolute right-5 size-control items-center justify-center rounded-pill bg-primary shadow-card active:bg-primary-pressed',
        focusRing,
        className,
      )}
      style={{ bottom: bottom + 20 }}
      {...props}>
      <Icon name={icon} color="on-primary" />
    </Pressable>
  );
}
