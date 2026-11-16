import type { MarketingActivityKind } from '../types';

/** The slug the backend notifies with for the Combination group (the Single one is the module id). */
export const COMBINATION_SLUG = 'marketing-activity-combination';

// Route paths this module owns. The matching files live in src/app/(app)/marketing-activity/.
export const marketingActivityRoutes = {
  list: '/marketing-activity',
  /** A document lives in one group, so the route names it; Single is the default. */
  detail: (uuid: string, kind: MarketingActivityKind = 'single') =>
    kind === 'combination'
      ? `/marketing-activity/${uuid}?kind=combination`
      : `/marketing-activity/${uuid}`,
} as const;
