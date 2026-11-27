/**
 * Token values for native props that cannot take a class name: icon colors, placeholder
 * text, and the activity indicator. src/global.css is the source of truth and tokens.test.ts
 * fails if the two drift apart. Style everything else with Tailwind utilities.
 */
export const colors = {
  primary: '#282828',
  'primary-pressed': '#404040',
  'on-primary': '#ffffff',
  'primary-soft': '#eeeeee',
  highlight: '#dddddd',
  accent: '#cbd77e',
  'accent-soft': '#d9e29f',
  hazel: '#e6ca9a',
  'chart-first': '#3d450f',
  'chart-second': '#5c671a',
  'chart-third': '#80892c',
  'chart-fourth': '#a8b34c',
  ink: '#282828',
  'ink-muted': '#6b6b6b',
  surface: '#ffffff',
  ground: '#f7f7f7',
  'ground-glow': '#d6e8ed',
  'surface-gray': '#f7f7f7',
  border: '#e6e6e6',
  'ink-raised': '#282828',
  'ink-line': '#3f3f3f',
  'on-ink-muted': '#adadad',
  scrim: 'rgba(40, 40, 40, 0.4)',
  glass: 'rgba(255, 255, 255, 0.7)',
  'control-off': '#8c8c8c',
  success: '#176a42',
  'success-bg': '#e6f4ec',
  danger: '#b42318',
  'danger-bg': '#fde8e8',
  warning: '#8a5a00',
  'warning-bg': '#fff4d6',
  blue: '#1d4ed8',
  'blue-soft': '#e6eeff',
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;

/** Sizes that native logic needs as numbers, such as the safe-area maths for the tab bar. */
export const sizes = {
  tabBar: 72,
  tabBarOffset: 16,
  tabBarContentGap: 32,
  toastOffset: 8,
  screenTopGap: 16,
  /** `--spacing-touch`: the height of a one-line control. */
  touch: 48,
} as const;

/** The `rounded-pill` radius, for native views that cannot take a class. */
export const radiusPill = 999;
