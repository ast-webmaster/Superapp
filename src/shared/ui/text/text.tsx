import { clsx } from 'clsx';
import { Text, type TextProps } from 'react-native';

const textVariants = {
  hero: 'text-hero',
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
  'tile-title': 'text-tile-title',
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
  blue: 'text-blue',
  // For text on a dark `ink` card: `on-primary` is the main text, this is the quiet one.
  'on-ink-muted': 'text-on-ink-muted',
} as const;

/** Each weight is its own family on native, so the variant picks the face, not `font-weight`. */
function fontFamily(variant: keyof typeof textVariants, tone: keyof typeof textTones) {
  return variant === 'body' ||
    variant === 'tile-title' ||
    tone === 'muted' ||
    tone === 'on-ink-muted'
    ? 'font-sora'
    : 'font-sora-semibold';
}

export interface AppTextProps extends TextProps {
  variant?: keyof typeof textVariants;
  tone?: keyof typeof textTones;
}

/** All text in the design system. `className` is for layout; use `variant` and `tone` for looks. */
export function AppText({ variant = 'body', tone = 'ink', className, ...props }: AppTextProps) {
  return (
    <Text
      className={clsx(fontFamily(variant, tone), textVariants[variant], textTones[tone], className)}
      {...props}
    />
  );
}
