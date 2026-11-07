/**
 * Splash screen constants. The native splash (app.json, expo-splash-screen) repeats
 * SPLASH_BG and the symbol size, so change them there too. Splash black is not a brand token.
 */
export const SPLASH_BG = '#000000';

/** Symbol width in dp. app.json renders the 1024px PNG at imageWidth 160 with the symbol at 75%. */
export const SPLASH_SYMBOL_WIDTH = 120;

/** One full pulse (grow and shrink). The symbol always finishes its cycle before zooming. */
export const PULSE_CYCLE_MS = 800;
export const PULSE_SCALE = 1.08;
/** The pulse runs for at least this long, rounded up to whole cycles. */
export const MIN_PULSE_MS = 800;

/** The symbol grows for the whole zoom; the white circle takes over in its last third. */
export const ZOOM_DURATION_MS = 3000;
export const ZOOM_SYMBOL_SCALE = 2.5;
export const CIRCLE_START_MS = (ZOOM_DURATION_MS * 2) / 3;
/** The status bar flips to dark icons once the circle has nearly covered the screen. */
export const COVERED_AT_MS = ZOOM_DURATION_MS * 0.9;

/** With reduce motion on, the splash only fades out. */
export const REDUCED_FADE_MS = 250;
