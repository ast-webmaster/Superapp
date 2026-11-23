import type { AnalyticsPeriod, RequestDesignListFilters } from '../types';

/**
 * Every React Query key of this module. The first segment is the manifest id, so no other module
 * can collide, and `lists()` / `details()` invalidate a whole family.
 */
export const requestDesignKeys = {
  all: ['request-design'] as const,
  lists: () => [...requestDesignKeys.all, 'list'] as const,
  list: (filters: RequestDesignListFilters, search: string) =>
    [...requestDesignKeys.lists(), filters, search] as const,
  details: () => [...requestDesignKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...requestDesignKeys.details(), uuid] as const,
  /** Brands, item choices, designers and point categories. */
  options: () => [...requestDesignKeys.all, 'options'] as const,
  /** Every month of the analytics, to refresh after a write that moves points. */
  analyticsAll: () => [...requestDesignKeys.all, 'analytics'] as const,
  analytics: ({ month, year }: AnalyticsPeriod) =>
    [...requestDesignKeys.all, 'analytics', year, month] as const,
};
