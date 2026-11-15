import type { PurchaseRequestListFilters } from '../types';

/**
 * Every React Query key of this module. The first segment is the manifest id, so no other
 * module can collide with it, and `all` / `lists()` / `details()` invalidate a whole family.
 */
export const purchaseRequestKeys = {
  all: ['purchase-request'] as const,
  lists: () => [...purchaseRequestKeys.all, 'list'] as const,
  list: (filters: PurchaseRequestListFilters, search: string) =>
    [...purchaseRequestKeys.lists(), filters, search] as const,
  details: () => [...purchaseRequestKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...purchaseRequestKeys.details(), uuid] as const,
  /** The pickers of the create form. They are never invalidated by an action. */
  lookups: () => [...purchaseRequestKeys.all, 'lookup'] as const,
  vendors: (search: string) => [...purchaseRequestKeys.lookups(), 'vendors', search] as const,
  offices: () => [...purchaseRequestKeys.lookups(), 'offices'] as const,
  items: (search: string) => [...purchaseRequestKeys.lookups(), 'items', search] as const,
};
