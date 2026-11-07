/**
 * Token values for native props that cannot take a class name: icon colors, placeholder
 * text, and the activity indicator. src/global.css is the source of truth and tokens.test.ts
 * fails if the two drift apart. Style everything else with Tailwind utilities.
 */
export const colors = {
  primary: '#130066',
  'primary-pressed': '#0c0044',
  'on-primary': '#ffffff',
  'primary-soft': '#eeeafb',
  lavender: '#c9b4ff',
  ink: '#0b0b1a',
  'ink-muted': '#5b6270',
  surface: '#ffffff',
  'surface-gray': '#f4f5f7',
  'surface-gray-clear': '#f4f5f700',
  border: '#e5e7eb',
  glass: 'rgba(255, 255, 255, 0.7)',
  'control-off': '#868c98',
  success: '#176a42',
  'success-bg': '#e6f4ec',
  danger: '#b42318',
  'danger-bg': '#fde8e8',
  warning: '#8a5a00',
  'warning-bg': '#fff4d6',
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
} as const;

/** The glass pill radius, for GlassView on iOS, which needs it as a number. */
export const radiusPill = 999;
