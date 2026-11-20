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
  // For text on a dark `ink` card: `on-primary` is the main text, these are the quiet and the
  // gain/loss colors that stay readable on it.
  'on-ink-muted': 'text-on-ink-muted',
  gain: 'text-gain',
  loss: 'text-loss',
} as const;

/** Each weight is its own family on native, so the variant picks the face, not `font-weight`. */
function fontFamily(variant: keyof typeof textVariants, tone: keyof typeof textTones) {
  if (variant === 'hero') return 'font-jakarta-extrabold';
  return variant === 'body' ||
    variant === 'tile-title' ||
    tone === 'muted' ||
    tone === 'on-ink-muted'
    ? 'font-jakarta'
    : 'font-jakarta-semibold';
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
