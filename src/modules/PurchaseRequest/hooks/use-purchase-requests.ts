import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { purchaseRequestApi } from '../api/purchaseRequestApi';
import { purchaseRequestKeys } from '../api/purchaseRequestKeys';
import type { PurchaseRequestListFilters } from '../types';

export function usePurchaseRequests(filters: PurchaseRequestListFilters, search: string) {
  return useInfiniteQuery({
    queryKey: purchaseRequestKeys.list(filters, search),
    queryFn: ({ pageParam, signal }) => purchaseRequestApi.list(filters, search, pageParam, signal),
    // Keep the rows on screen while a new search loads, instead of flashing the skeleton.
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.current_page < meta.last_page ? meta.current_page + 1 : undefined,
    // Newest first, so a request submitted while the user scrolls shifts rows into the next
    // page. Merging by uuid keeps the first occurrence and avoids duplicate rows.
    select: ({ pages }) => [
      ...new Map(pages.flatMap((page) => page.items).map((item) => [item.uuid, item])).values(),
    ],
  });
}
