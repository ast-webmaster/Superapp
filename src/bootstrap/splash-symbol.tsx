import Svg, { Path } from 'react-native-svg';

import { SPLASH_SYMBOL_WIDTH } from './splash-config';

// Geometry of assets/brand/astrindo-symbol-white.svg as plain paths: no Mask or Use, so the
// triangle's hole is a real cut-out (even-odd) and the gaps between shapes stay transparent.
const VIEW_BOX = { width: 634, height: 550 };
const TRIANGLE = 'M365.5 110.5 L683.5 659.5 H50 Z M367 350.5 L443 476.5 L367 594.5 L292 476.5 Z';
const DIAMONDS =
  'M151.5 141.5 L182.5 188.5 L151.5 235.5 L120.5 188.5 Z ' +
  'M219.5 141.5 L250.5 188.5 L219.5 235.5 L188.5 188.5 Z ' +
  'M117.5 197 L148.5 244 L117.5 291 L86.5 244 Z ' +
  'M185.5 197 L216.5 244 L185.5 291 L154.5 244 Z ' +
  'M253.5 197 L284.5 244 L253.5 291 L222.5 244 Z ' +
  'M151.5 252 L182.5 299 L151.5 346 L120.5 299 Z ' +
  'M219.5 252 L250.5 299 L219.5 346 L188.5 299 Z ' +
  'M185.5 307.5 L216.5 354.5 L185.5 401.5 L154.5 354.5 Z';

/** The white Astrindo symbol used by the splash screen. Decorative: the splash carries no text. */
export function SplashSymbol({ width = SPLASH_SYMBOL_WIDTH }: { width?: number }) {
  return (
    <Svg
      width={width}
      height={(width * VIEW_BOX.height) / VIEW_BOX.width}
      viewBox={`50 110 ${VIEW_BOX.width} ${VIEW_BOX.height}`}
      fill="#ffffff">
      <Path fillRule="evenodd" d={TRIANGLE} />
      <Path d={DIAMONDS} />
    </Svg>
  );
}
