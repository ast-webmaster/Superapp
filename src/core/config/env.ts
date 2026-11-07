// EXPO_PUBLIC_* values are inlined at build time, so each one must be read as a
// literal `process.env.EXPO_PUBLIC_X` expression (dynamic access is not replaced).
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error('EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env.local and fill it in.');
}

export const env = {
  /** Base URL of the Laravel API, without a trailing slash. */
  apiUrl: apiUrl.replace(/\/+$/, ''),
} as const;
