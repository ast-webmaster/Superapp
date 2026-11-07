import type { PriceApprovalFilter } from '../types';

/**
 * Every React Query key of this module. The first segment is the manifest id, so no other
 * module can collide with it, and `all` / `lists()` / `details()` invalidate a whole family.
 */
export const priceApprovalKeys = {
  all: ['price-approval'] as const,
  lists: () => [...priceApprovalKeys.all, 'list'] as const,
  list: (filter: PriceApprovalFilter) => [...priceApprovalKeys.lists(), filter] as const,
  details: () => [...priceApprovalKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...priceApprovalKeys.details(), uuid] as const,
};
