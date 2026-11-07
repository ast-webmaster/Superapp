import { clsx } from 'clsx';
import type { ComponentRef, Ref } from 'react';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { colors, type ColorToken } from '@/shared/theme/tokens';

import { focusRing } from '../focus';
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
    container: 'bg-primary-soft active:bg-lavender',
    tone: 'primary',
    icon: 'primary',
  },
} as const satisfies Record<
  string,
  { container: string; tone: AppTextProps['tone']; icon: ColorToken }
>;

export interface ButtonProps extends Omit<PressableProps, 'children' | 'disabled' | 'style'> {
  children: string;
  variant?: keyof typeof variants;
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
  iconLeft,
  iconRight,
  block = false,
  loading = false,
  disabled = false,
  className,
  ...props
}: ButtonProps) {
  const { container, tone, icon } = variants[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      role="button"
      aria-busy={loading}
      aria-disabled={inactive}
      disabled={inactive}
      className={clsx(
        'min-h-control flex-row items-center justify-center gap-3 rounded-pill px-6',
        block ? 'self-stretch' : 'self-start',
        container,
        disabled && 'opacity-50',
        focusRing,
        className,
      )}
      {...props}>
      {loading ? <ActivityIndicator color={colors[icon]} /> : null}
      {!loading && iconLeft ? <Icon name={iconLeft} color={icon} /> : null}
      <AppText variant="button" tone={tone}>
        {children}
      </AppText>
      {!loading && iconRight ? <Icon name={iconRight} color={icon} /> : null}
    </Pressable>
  );
}
