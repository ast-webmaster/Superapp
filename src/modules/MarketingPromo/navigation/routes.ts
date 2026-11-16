import type { MarketingPromoKind } from '../types';

/** The slug the backend notifies with for the Combination group (the Single one is the module id). */
export const COMBINATION_SLUG = 'marketing-promo-combination';

// Route paths this module owns. The matching files live in src/app/(app)/marketing-promo/.
export const marketingPromoRoutes = {
  list: '/marketing-promo',
  /** A document lives in one group, so the route names it; Single is the default. */
  detail: (uuid: string, kind: MarketingPromoKind = 'single') =>
    kind === 'combination'
      ? `/marketing-promo/${uuid}?kind=combination`
      : `/marketing-promo/${uuid}`,
} as const;
