import { apiClient } from '@/core/api';

import type { PageMeta, PriceApprovalFilter, PriceApprovalListItem } from '../types';

const PAGE_SIZE = 15;

export const priceApprovalApi = {
  list: async (filter: PriceApprovalFilter, page: number, signal?: AbortSignal) => {
    const response = await apiClient.get<PriceApprovalListItem[], PageMeta>('/price-approval', {
      query: { status: filter === 'all' ? undefined : filter, page, per_page: PAGE_SIZE },
      signal,
    });
    return { items: response.data, meta: response.meta };
  },
};
