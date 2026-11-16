import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { marketingPromoApi } from '../api/marketingPromoApi';
import { marketingPromoKeys } from '../api/marketingPromoKeys';
import type { MarketingPromoKind, MarketingPromoListFilters } from '../types';

export function useMarketingPromos(
  kind: MarketingPromoKind,
  filters: MarketingPromoListFilters,
  search: string,
) {
  return useInfiniteQuery({
    queryKey: marketingPromoKeys.list(kind, filters, search),
    queryFn: ({ pageParam, signal }) =>
      marketingPromoApi.list(kind, filters, search, pageParam, signal),
    // Keep the rows on screen while a new search loads, instead of flashing the skeleton.
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.current_page < meta.last_page ? meta.current_page + 1 : undefined,
    // Newest first, so a promo submitted while the user scrolls shifts rows into the next
    // page. Merging by uuid keeps the first occurrence and avoids duplicate rows.
    select: ({ pages }) => [
      ...new Map(pages.flatMap((page) => page.items).map((item) => [item.uuid, item])).values(),
    ],
  });
}
