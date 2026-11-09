import { apiClient } from '@/core/api';

import type { InboxItem, PageMeta } from '../types';

export const inboxApi = {
  /** `modules` limits the list to those modules; leave it out for everything. */
  list: async (
    modules: readonly string[] | undefined,
    perPage: number,
    page: number,
    signal?: AbortSignal,
  ) => {
    const response = await apiClient.get<InboxItem[], PageMeta>('/notifications', {
      query: { module: modules?.join(','), per_page: perPage, page },
      signal,
    });
    return { items: response.data, meta: response.meta };
  },
};
