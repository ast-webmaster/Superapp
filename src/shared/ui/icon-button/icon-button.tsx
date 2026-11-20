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
  /** `gray` fills the idle circle with `surface-gray`, for a button inside a white card. */
  tone?: 'surface' | 'gray';
  disabled?: boolean;
  /**
   * `sm` draws a 40 circle inside the 48 press area, for a header where 56 is too heavy.
   * `xs` draws a 32 highlight circle with a 16 icon in the same 48 press area, for row actions
   * on a card (edit, remove).
   */
  size?: 'md' | 'sm' | 'xs';
  className?: string;
  ref?: Ref<ComponentRef<typeof Pressable>>;
}

export function IconButton({
  icon,
  label,
  active = false,
  tone = 'surface',
  disabled = false,
  size = 'md',
  className,
  ...props
}: IconButtonProps) {
  const idle = size === 'xs' ? 'bg-highlight' : tone === 'gray' ? 'bg-surface-gray' : 'bg-surface';
  const fill = active ? 'bg-primary' : idle;
  const pressed = active ? 'active:bg-primary-pressed' : 'active:bg-border';
  const iconColor = active ? 'on-primary' : size === 'xs' ? 'primary' : 'ink';

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
        size === 'md'
          ? ['size-control', fill, pressed]
          : ['size-touch', size === 'xs' && 'active:opacity-70'],
        disabled && 'opacity-50',
        focusRing,
        className,
      )}
      {...props}>
      {size === 'md' ? (
        <Icon name={icon} color={iconColor} />
      ) : (
        <View
          className={clsx(
            'items-center justify-center rounded-pill',
            size === 'xs' ? 'size-8' : 'size-10',
            fill,
          )}>
          <Icon name={icon} size={size === 'xs' ? 16 : 20} color={iconColor} />
        </View>
      )}
    </Pressable>
  );
}
