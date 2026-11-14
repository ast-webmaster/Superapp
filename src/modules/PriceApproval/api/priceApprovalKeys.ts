import type { PriceApprovalListFilters } from '../types';

/**
 * Every React Query key of this module. The first segment is the manifest id, so no other
 * module can collide with it, and `all` / `lists()` / `details()` invalidate a whole family.
 */
export const priceApprovalKeys = {
  all: ['price-approval'] as const,
  lists: () => [...priceApprovalKeys.all, 'list'] as const,
  list: (filters: PriceApprovalListFilters, search: string) =>
    [...priceApprovalKeys.lists(), filters, search] as const,
  details: () => [...priceApprovalKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...priceApprovalKeys.details(), uuid] as const,
  /** The pickers of the create form. They are never invalidated by an action. */
  lookups: () => [...priceApprovalKeys.all, 'lookup'] as const,
  customers: (search: string) => [...priceApprovalKeys.lookups(), 'customers', search] as const,
  products: (search: string) => [...priceApprovalKeys.lookups(), 'products', search] as const,
  managers: (search: string) => [...priceApprovalKeys.lookups(), 'managers', search] as const,
};
