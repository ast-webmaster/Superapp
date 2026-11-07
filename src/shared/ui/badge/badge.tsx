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

export interface BadgeProps {
  label: string;
  tone?: keyof typeof tones;
  icon?: IconName;
  /** Fills the icon, for a pinned star. */
  iconFilled?: boolean;
  className?: string;
}

export function Badge({ label, tone = 'neutral', icon, iconFilled, className }: BadgeProps) {
  const style = tones[tone];

  return (
    <View
      className={clsx(
        'min-h-8 flex-row items-center gap-1 self-start rounded-pill px-3',
        style.container,
        className,
      )}>
      {icon ? <Icon name={icon} size={16} color={style.icon} filled={iconFilled} /> : null}
      <AppText variant="caption" tone={style.text}>
        {label}
      </AppText>
    </View>
  );
}
