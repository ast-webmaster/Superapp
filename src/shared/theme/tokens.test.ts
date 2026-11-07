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

  it('keeps the native sizes identical to global.css', () => {
    expect(css).toContain(`--spacing-tabbar: ${sizes.tabBar}px;`);
    expect(css).toContain(`--radius-pill: ${radiusPill}px;`);
  });
});
