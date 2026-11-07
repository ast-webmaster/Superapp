import { clsx } from 'clsx';
import type { ComponentRef, Ref } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style' | 'disabled'> {
  icon: IconName;
  /** What the button does, for screen readers. */
  label: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  ref?: Ref<ComponentRef<typeof Pressable>>;
}

export function IconButton({
  icon,
  label,
  active = false,
  disabled = false,
  className,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-pressed={active}
      aria-disabled={disabled}
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      className={clsx(
        'size-control items-center justify-center rounded-pill',
        active ? 'bg-primary active:bg-primary-pressed' : 'bg-surface-gray active:bg-border',
        disabled && 'opacity-50',
        focusRing,
        className,
      )}
      {...props}>
      <Icon name={icon} color={active ? 'on-primary' : 'ink'} />
    </Pressable>
  );
}
