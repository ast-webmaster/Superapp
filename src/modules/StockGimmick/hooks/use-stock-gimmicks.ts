import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { stockGimmickApi } from '../api/stockGimmickApi';
import { stockGimmickKeys } from '../api/stockGimmickKeys';
import type { StockListItem, StockPage } from '../types';

function merge(pages: StockPage[]): StockListItem[] {
  // Newest rows come first, so one added while the user scrolls shifts rows into the next
  // page. Merging by id keeps the first occurrence and avoids duplicate rows.
  return [...new Map(pages.flatMap((page) => page.items).map((item) => [item.id, item])).values()];
}

export function useStockGimmicks(search: string) {
  return useInfiniteQuery({
    queryKey: stockGimmickKeys.list(search),
    queryFn: ({ pageParam, signal }) => stockGimmickApi.list(search, pageParam, signal),
    // Keep the rows on screen while a new search loads, instead of flashing the skeleton.
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.current_page < meta.last_page ? meta.current_page + 1 : undefined,
    select: ({ pages }) => merge(pages),
  });
}
