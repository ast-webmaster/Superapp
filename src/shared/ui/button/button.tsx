import { clsx } from 'clsx';
import type { ComponentRef, Ref } from 'react';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { colors, type ColorToken } from '@/shared/theme/tokens';

import { focusRing } from '../focus';
import { pressScale } from '../press';
import { Icon, type IconName } from '../icon/icon';
import { AppText, type AppTextProps } from '../text/text';

const variants = {
  primary: {
    container: 'bg-primary active:bg-primary-pressed',
    tone: 'on-primary',
    icon: 'on-primary',
  },
  secondary: {
    container: 'bg-surface shadow-card active:bg-surface-gray',
    tone: 'ink',
    icon: 'ink',
  },
  soft: {
    container: 'bg-primary-soft active:bg-highlight',
    tone: 'primary',
    icon: 'primary',
  },
} as const satisfies Record<
  string,
  { container: string; tone: AppTextProps['tone']; icon: ColorToken }
>;

const sizes = {
  md: { container: 'min-h-control gap-3 px-6', icon: 24 },
  sm: { container: 'min-h-10 gap-2 px-4', icon: 16 },
} as const;

export interface ButtonProps extends Omit<PressableProps, 'children' | 'disabled' | 'style'> {
  children: string;
  variant?: keyof typeof variants;
  /** `sm` is a 40 high button for secondary actions inside content; it keeps a 48 press area. */
  size?: keyof typeof sizes;
  iconLeft?: IconName;
  iconRight?: IconName;
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  ref?: Ref<ComponentRef<typeof Pressable>>;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  block = false,
  loading = false,
  disabled = false,
  className,
  ...props
}: ButtonProps) {
  const { container, tone, icon } = variants[variant];
  const { container: sizeContainer, icon: iconSize } = sizes[size];
  const inactive = disabled || loading;

  return (
    <Pressable
      role="button"
      aria-busy={loading}
      aria-disabled={inactive}
      disabled={inactive}
      hitSlop={size === 'sm' ? 4 : undefined}
      className={clsx(
        'flex-row items-center justify-center rounded-pill',
        sizeContainer,
        block ? 'self-stretch' : 'self-start',
        container,
        disabled && 'opacity-50',
        pressScale,
        focusRing,
        className,
      )}
      {...props}>
      {loading ? <ActivityIndicator size={iconSize} color={colors[icon]} /> : null}
      {!loading && iconLeft ? <Icon name={iconLeft} size={iconSize} color={icon} /> : null}
      <AppText variant="button" tone={tone}>
        {children}
      </AppText>
      {!loading && iconRight ? <Icon name={iconRight} size={iconSize} color={icon} /> : null}
    </Pressable>
  );
}
