import { clsx } from 'clsx';
import { View } from 'react-native';

import type { ColorToken } from '@/shared/theme/tokens';

import { Icon, type IconName } from '../icon/icon';
import { AppText, type AppTextProps } from '../text/text';

const tones = {
  neutral: { container: 'bg-surface-gray', text: 'ink', icon: 'ink' },
  info: { container: 'bg-primary-soft', text: 'primary', icon: 'primary' },
  success: { container: 'bg-success-bg', text: 'success', icon: 'success' },
  danger: { container: 'bg-danger-bg', text: 'danger', icon: 'danger' },
  warning: { container: 'bg-warning-bg', text: 'warning', icon: 'warning' },
} as const satisfies Record<
  string,
  { container: string; text: AppTextProps['tone']; icon: ColorToken }
>;

const sizes = {
  md: { container: 'min-h-8 px-3', icon: 16, text: 'caption' },
  sm: { container: 'min-h-6 px-2', icon: 12, text: 'label' },
  xs: { container: 'min-h-3 px-1.5', icon: 10, text: 'micro' },
} as const;

export interface BadgeProps {
  label: string;
  tone?: keyof typeof tones;
  icon?: IconName;
  /** Fills the icon, for a pinned star. */
  iconFilled?: boolean;
  /** `sm` for a badge inside a dense row, `xs` for a quiet tag under a title. */
  size?: 'md' | 'sm' | 'xs';
  className?: string;
}

export function Badge({
  label,
  tone = 'neutral',
  icon,
  iconFilled,
  size = 'md',
  className,
}: BadgeProps) {
  const style = tones[tone];

  return (
    <View
      className={clsx(
        'flex-row items-center gap-1 self-start rounded-pill',
        sizes[size].container,
        style.container,
        className,
      )}>
      {icon ? (
        <Icon name={icon} size={sizes[size].icon} color={style.icon} filled={iconFilled} />
      ) : null}
      <AppText variant={sizes[size].text} tone={style.text}>
        {label}
      </AppText>
    </View>
  );
}
