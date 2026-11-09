import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import { inboxApi } from '../api/inboxApi';
import { inboxKeys } from '../api/inboxKeys';
import type { InboxItem, PageMeta } from '../types';

type Page = { items: InboxItem[]; meta: PageMeta };

// Module level, so React Query sees the same function on every render.
const selectInbox = ({ pages }: InfiniteData<Page>) => ({
  items: [...new Map(pages.flatMap((page) => page.items).map((item) => [item.id, item])).values()],
  total: pages[0]?.meta.total ?? 0,
});

export interface UseInboxOptions {
  /** Only these modules' items. Omit for every module. */
  modules?: readonly string[];
  perPage?: number;
  enabled?: boolean;
}

/** The signed-in user's waiting documents, newest first, and how many there are in all. */
export function useInbox({ modules, perPage = 20, enabled = true }: UseInboxOptions = {}) {
  return useInfiniteQuery({
    queryKey: inboxKeys.list(modules, perPage),
    queryFn: ({ pageParam, signal }) => inboxApi.list(modules, perPage, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.current_page < meta.last_page ? meta.current_page + 1 : undefined,
    // The inbox changes on the server whenever someone acts on a document.
    staleTime: 15_000,
    enabled,
    select: selectInbox,
  });
}

/** Unread items in all modules, for the badge on the Inbox tab. */
export function useInboxTotal() {
  return useInbox({ perPage: 1 }).data?.total ?? 0;
}

/**
 * Refresh the inbox each time the screen is shown again (a tab switch does not count as the
 * app coming back to the foreground, which is what React Query listens for). The first focus
 * is skipped: the screen is fetching then anyway.
 */
export function useRefreshInboxOnFocus() {
  const queryClient = useQueryClient();
  const first = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      void queryClient.refetchQueries({ queryKey: inboxKeys.all, type: 'active', stale: true });
    }, [queryClient]),
  );
}
