import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { colors, radiusPill, sizes } from './tokens';

const css = readFileSync(join(process.cwd(), 'src/global.css'), 'utf8');

function cssColors() {
  const found: Record<string, string> = {};
  for (const [, name, value] of css.matchAll(/--color-([a-z-]+):\s*([^;]+);/g)) {
    if (name && value && name !== '*') found[name] = value.trim();
  }
  return found;
}

describe('design tokens', () => {
  it('keeps the native color values identical to global.css', () => {
    expect(colors).toEqual(cssColors());
  });

  // react-native-css reads any line-height that reaches it through var() (which every
  // Tailwind text-* utility does) as a multiple of the font size, so 24px became 24 × 16 = 384
  // on native. Line heights must be unitless ratios; this checks each one still lands on its px.
  it('writes line heights as ratios that resolve to the intended px', () => {
    const intendedPx: Record<string, number> = {
      display: 44,
      heading: 34,
      title: 26,
      'module-title': 22,
      'info-title': 24,
      body: 24,
      'body-strong': 24,
      caption: 20,
      button: 20,
      label: 16,
    };
    const found: Record<string, number> = {};
    for (const [, name, ratio] of css.matchAll(/--text-([a-z-]+)--line-height:\s*([^;]+);/g)) {
      expect(ratio).toMatch(/^\d+(\.\d+)?$/);
      const size = css.match(new RegExp(`--text-${name}:\\s*(\\d+)px;`))?.[1];
      found[name!] = Math.round(Number(ratio) * Number(size) * 100) / 100;
    }
    expect(found).toEqual(intendedPx);
  });

  it('keeps the native sizes identical to global.css', () => {
    expect(css).toContain(`--spacing-tabbar: ${sizes.tabBar}px;`);
    expect(css).toContain(`--radius-pill: ${radiusPill}px;`);
  });
});
