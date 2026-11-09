import { clsx } from 'clsx';
import { Text, type TextProps } from 'react-native';

const textVariants = {
  avatar: 'text-avatar',
  display: 'text-display',
  heading: 'text-heading',
  title: 'text-title',
  'module-title': 'text-module-title',
  'info-title': 'text-info-title',
  body: 'text-body',
  'body-strong': 'text-body-strong',
  caption: 'text-caption',
  'caption-strong': 'text-caption-strong',
  button: 'text-button',
  label: 'text-label',
  micro: 'text-micro',
} as const;

const textTones = {
  ink: 'text-ink',
  muted: 'text-ink-muted',
  primary: 'text-primary',
  'on-primary': 'text-on-primary',
  success: 'text-success',
  danger: 'text-danger',
  warning: 'text-warning',
} as const;

export interface AppTextProps extends TextProps {
  variant?: keyof typeof textVariants;
  tone?: keyof typeof textTones;
}

/** All text in the design system. `className` is for layout; use `variant` and `tone` for looks. */
export function AppText({ variant = 'body', tone = 'ink', className, ...props }: AppTextProps) {
  return (
    <Text
      className={clsx(
        variant === 'body' || tone === 'muted' ? 'font-rubik' : 'font-rubik-medium',
        textVariants[variant],
        textTones[tone],
        className,
      )}
      {...props}
    />
  );
}
