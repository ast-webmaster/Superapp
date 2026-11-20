/**
 * Token values for native props that cannot take a class name: icon colors, placeholder
 * text, and the activity indicator. src/global.css is the source of truth and tokens.test.ts
 * fails if the two drift apart. Style everything else with Tailwind utilities.
 */
export const colors = {
  primary: '#111113',
  'primary-pressed': '#2c2c31',
  'on-primary': '#ffffff',
  'primary-soft': '#ececee',
  highlight: '#d9d9dd',
  accent: '#f3af00',
  ink: '#111113',
  'ink-muted': '#6a6a72',
  surface: '#ffffff',
  ground: '#f2f2f3',
  'surface-gray': '#f6f6f7',
  border: '#e4e4e7',
  'ink-raised': '#1c1c21',
  'ink-line': '#303036',
  'on-ink-muted': '#a9a9b1',
  gain: '#34d399',
  loss: '#fb7185',
  scrim: 'rgba(17, 17, 19, 0.4)',
  glass: 'rgba(255, 255, 255, 0.7)',
  'control-off': '#8b8b93',
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
} as const;

/** The glass pill radius, for GlassView on iOS, which needs it as a number. */
export const radiusPill = 999;
