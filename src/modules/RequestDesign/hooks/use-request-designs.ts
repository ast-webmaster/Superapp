import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { requestDesignApi } from '../api/requestDesignApi';
import { requestDesignKeys } from '../api/requestDesignKeys';
import type { RequestDesignListFilters } from '../types';

export function useRequestDesigns(filters: RequestDesignListFilters, search: string) {
  return useInfiniteQuery({
    queryKey: requestDesignKeys.list(filters, search),
    queryFn: ({ pageParam, signal }) => requestDesignApi.list(filters, search, pageParam, signal),
    // Keep the rows on screen while a new search loads, instead of flashing the skeleton.
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.current_page < meta.last_page ? meta.current_page + 1 : undefined,
    // High priority first, then newest, so a document created while the user scrolls shifts rows
    // into the next page. Merging by uuid keeps the first occurrence and avoids duplicate rows.
    select: ({ pages }) => [
      ...new Map(pages.flatMap((page) => page.items).map((item) => [item.uuid, item])).values(),
    ],
  });
}
