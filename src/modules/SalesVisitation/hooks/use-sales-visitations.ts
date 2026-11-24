import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { salesVisitationApi } from '../api/salesVisitationApi';
import { salesVisitationKeys } from '../api/salesVisitationKeys';
import type { SalesVisitationListFilters } from '../types';

export function useSalesVisitations(filters: SalesVisitationListFilters, search: string) {
  return useInfiniteQuery({
    queryKey: salesVisitationKeys.list(filters, search),
    queryFn: ({ pageParam, signal }) => salesVisitationApi.list(filters, search, pageParam, signal),
    // Keep the rows on screen while a new search loads, instead of flashing the skeleton.
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.current_page < meta.last_page ? meta.current_page + 1 : undefined,
    // Newest visit date first, so a visit planned while the user scrolls shifts rows into the
    // next page. Merging by uuid keeps the first occurrence and avoids duplicate rows.
    select: ({ pages }) => [
      ...new Map(pages.flatMap((page) => page.items).map((item) => [item.uuid, item])).values(),
    ],
  });
}
