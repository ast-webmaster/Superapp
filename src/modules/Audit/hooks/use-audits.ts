import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { auditApi } from '../api/auditApi';
import { auditKeys } from '../api/auditKeys';
import type { AuditListFilters, AuditListItem, AuditPage } from '../types';

function merge(pages: AuditPage[]): AuditListItem[] {
  // Newest cards come first, so one created while the user scrolls shifts rows into the next
  // page. Merging by uuid keeps the first occurrence and avoids duplicate rows.
  return [
    ...new Map(pages.flatMap((page) => page.items).map((item) => [item.uuid, item])).values(),
  ];
}

export function useAudits(filters: AuditListFilters, search: string) {
  return useInfiniteQuery({
    queryKey: auditKeys.list(filters, search),
    queryFn: ({ pageParam, signal }) => auditApi.list(filters, search, pageParam, signal),
    // Keep the rows on screen while a new search loads, instead of flashing the skeleton.
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.current_page < meta.last_page ? meta.current_page + 1 : undefined,
    select: ({ pages }) => merge(pages),
  });
}
