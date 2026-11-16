import type { MarketingPromoKind, MarketingPromoListFilters } from '../types';

/**
 * Every React Query key of this module. The first segment is the manifest id, so no other
 * module can collide with it. The kind is part of every key: a uuid is only valid in its own
 * group, so the same uuid in the other group is a different (missing) document.
 */
export const marketingPromoKeys = {
  all: ['marketing-promo'] as const,
  lists: () => [...marketingPromoKeys.all, 'list'] as const,
  list: (kind: MarketingPromoKind, filters: MarketingPromoListFilters, search: string) =>
    [...marketingPromoKeys.lists(), kind, filters, search] as const,
  details: () => [...marketingPromoKeys.all, 'detail'] as const,
  detail: (kind: MarketingPromoKind, uuid: string) =>
    [...marketingPromoKeys.details(), kind, uuid] as const,
};
