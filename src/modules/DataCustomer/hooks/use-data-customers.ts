import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { dataCustomerApi } from '../api/dataCustomerApi';
import { dataCustomerKeys } from '../api/dataCustomerKeys';
import type { CustomerListItem, CustomerPage } from '../types';

function merge(pages: CustomerPage[]): CustomerListItem[] {
  // Newest customers come first, so one added while the user scrolls shifts rows into the next
  // page. Merging by id keeps the first occurrence and avoids duplicate rows.
  return [...new Map(pages.flatMap((page) => page.items).map((item) => [item.id, item])).values()];
}

export function useDataCustomers(search: string) {
  return useInfiniteQuery({
    queryKey: dataCustomerKeys.list(search),
    queryFn: ({ pageParam, signal }) => dataCustomerApi.list(search, pageParam, signal),
    // Keep the rows on screen while a new search loads, instead of flashing the skeleton.
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.current_page < meta.last_page ? meta.current_page + 1 : undefined,
    select: ({ pages }) => merge(pages),
  });
}
