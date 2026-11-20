import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { dataProductApi } from '../api/dataProductApi';
import { dataProductKeys } from '../api/dataProductKeys';
import type { ProductFilters, ProductListItem, ProductPage } from '../types';

function merge(pages: ProductPage[]): ProductListItem[] {
  // Newest products come first, so one added while the user scrolls shifts rows into the next
  // page. Merging by id keeps the first occurrence and avoids duplicate rows.
  return [
    ...new Map(pages.flatMap((page) => page.items).map((item) => [item.id, item])).values(),
  ];
}

export function useDataProducts(filters: ProductFilters, search: string) {
  return useInfiniteQuery({
    queryKey: dataProductKeys.list(filters, search),
    queryFn: ({ pageParam, signal }) => dataProductApi.list(filters, search, pageParam, signal),
    // Keep the rows on screen while a new search loads, instead of flashing the skeleton.
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.current_page < meta.last_page ? meta.current_page + 1 : undefined,
    select: ({ pages }) => merge(pages),
  });
}
