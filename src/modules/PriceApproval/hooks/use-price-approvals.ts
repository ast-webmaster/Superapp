import { useInfiniteQuery } from '@tanstack/react-query';

import { priceApprovalApi } from '../api/priceApprovalApi';
import type { PriceApprovalFilter } from '../types';

export function usePriceApprovals(filter: PriceApprovalFilter) {
  return useInfiniteQuery({
    queryKey: ['price-approvals', 'list', filter],
    queryFn: ({ pageParam, signal }) => priceApprovalApi.list(filter, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: ({ meta }) => (meta.current_page < meta.last_page ? meta.current_page + 1 : undefined),
    // Newest first, so a request submitted while the user scrolls shifts rows into the next
    // page. Merging by uuid keeps the first occurrence and avoids duplicate rows.
    select: ({ pages }) => [
      ...new Map(pages.flatMap((page) => page.items).map((item) => [item.pa_uuid, item])).values(),
    ],
  });
}
