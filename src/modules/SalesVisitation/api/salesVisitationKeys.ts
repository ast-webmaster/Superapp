import type { SalesVisitationListFilters } from '../types';

/**
 * Every React Query key of this module. The first segment is the manifest id, so no other module
 * can collide, and `lists()` / `details()` invalidate a whole family.
 */
export const salesVisitationKeys = {
  all: ['sales-visitation'] as const,
  lists: () => [...salesVisitationKeys.all, 'list'] as const,
  list: (filters: SalesVisitationListFilters, search: string) =>
    [...salesVisitationKeys.lists(), filters, search] as const,
  details: () => [...salesVisitationKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...salesVisitationKeys.details(), uuid] as const,
  /** Purposes, brand categories and the panel rules. */
  options: () => [...salesVisitationKeys.all, 'options'] as const,
  customers: (term: string) => [...salesVisitationKeys.all, 'customers', term] as const,
  customerLocations: (customerId: string) =>
    [...salesVisitationKeys.all, 'customer-locations', customerId] as const,
  geocode: (term: string) => [...salesVisitationKeys.all, 'geocode', term] as const,
  /** One proof photo, `in` or `out`. */
  photo: (uuid: string, type: 'in' | 'out') =>
    [...salesVisitationKeys.all, 'photo', uuid, type] as const,
};
