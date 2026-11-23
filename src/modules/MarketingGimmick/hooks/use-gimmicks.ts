import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { marketingGimmickApi } from '../api/marketingGimmickApi';
import { marketingGimmickKeys } from '../api/marketingGimmickKeys';
import type { GimmickFlow, GimmickListFilters } from '../types';

export function useGimmicks(flow: GimmickFlow, filters: GimmickListFilters, search: string) {
  return useInfiniteQuery({
    queryKey: marketingGimmickKeys.list(flow, filters, search),
    queryFn: ({ pageParam, signal }) =>
      marketingGimmickApi.list(flow, filters, search, pageParam, signal),
    // Keep the rows on screen while a new search loads, instead of flashing the skeleton.
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.current_page < meta.last_page ? meta.current_page + 1 : undefined,
    // Newest first, so a document created while the user scrolls shifts rows into the next page.
    // Merging by uuid keeps the first occurrence and avoids duplicate rows.
    select: ({ pages }) => [
      ...new Map(pages.flatMap((page) => page.items).map((item) => [item.uuid, item])).values(),
    ],
  });
}
