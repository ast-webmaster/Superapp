import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { stockPenjualanApi } from '../api/stockPenjualanApi';
import { stockPenjualanKeys } from '../api/stockPenjualanKeys';
import type { StockFilters, StockItem, StockPage, StockView } from '../types';

export type StockResult = {
  view: StockView;
  items: StockItem[];
  lastUpdatedAt: string | null;
};

function merge(pages: StockPage[]): StockResult {
  const first = pages[0];
  // Newest products come first, so one added while the user scrolls shifts rows into the next
  // page. Merging by product code keeps the first occurrence and avoids duplicate rows.
  const items = [
    ...new Map(
      pages.flatMap((page) => page.items).map((item) => [item.product_code, item]),
    ).values(),
  ];
  return {
    view: first?.meta.view ?? 'sales',
    items,
    lastUpdatedAt: first?.meta.last_updated_at ?? null,
  };
}

export function useStockItems(filters: StockFilters, search: string) {
  return useInfiniteQuery({
    queryKey: stockPenjualanKeys.list(filters, search),
    queryFn: ({ pageParam, signal }) => stockPenjualanApi.list(filters, search, pageParam, signal),
    // Keep the rows on screen while a new search loads, instead of flashing the skeleton.
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.current_page < meta.last_page ? meta.current_page + 1 : undefined,
    select: ({ pages }) => merge(pages),
  });
}
