import type { MarketingActivityKind, MarketingActivityListFilters } from '../types';

/**
 * Every React Query key of this module. The first segment is the manifest id, so no other
 * module can collide with it. The kind is part of every key: a uuid is only valid in its own
 * group, so the same uuid in the other group is a different (missing) document.
 */
export const marketingActivityKeys = {
  all: ['marketing-activity'] as const,
  lists: () => [...marketingActivityKeys.all, 'list'] as const,
  list: (kind: MarketingActivityKind, filters: MarketingActivityListFilters, search: string) =>
    [...marketingActivityKeys.lists(), kind, filters, search] as const,
  details: () => [...marketingActivityKeys.all, 'detail'] as const,
  detail: (kind: MarketingActivityKind, uuid: string) =>
    [...marketingActivityKeys.details(), kind, uuid] as const,
};
