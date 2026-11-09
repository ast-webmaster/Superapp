import { clsx } from 'clsx';
import type { ComponentRef, Ref } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';

import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style' | 'disabled'> {
  icon: IconName;
  /** What the button does, for screen readers. */
  label: string;
  active?: boolean;
  disabled?: boolean;
  /** `sm` draws a 40 circle inside the 48 press area, for a header where 56 is too heavy. */
  size?: 'md' | 'sm';
  className?: string;
  ref?: Ref<ComponentRef<typeof Pressable>>;
}

export function IconButton({
  icon,
  label,
  active = false,
  disabled = false,
  size = 'md',
  className,
  ...props
}: IconButtonProps) {
  const fill = active ? 'bg-primary' : 'bg-surface';
  const pressed = active ? 'active:bg-primary-pressed' : 'active:bg-border';
  const iconColor = active ? 'on-primary' : 'ink';

  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-pressed={active}
      aria-disabled={disabled}
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      className={clsx(
        'items-center justify-center rounded-pill',
        size === 'md' ? ['size-control', fill, pressed] : 'size-touch',
        disabled && 'opacity-50',
        focusRing,
        className,
      )}
      {...props}>
      {size === 'md' ? (
        <Icon name={icon} color={iconColor} />
      ) : (
        <View className={clsx('size-10 items-center justify-center rounded-pill', fill)}>
          <Icon name={icon} size={20} color={iconColor} />
        </View>
      )}
    </Pressable>
  );
}
