import { apiClient } from '@/core/api';

import type { PriceApproval, PriceApprovalFilter } from '../types';

// ASSUMED endpoint and response envelope (`{ data: [...] }`, like a Laravel API Resource).
export const priceApprovalApi = {
  list: async (filter: PriceApprovalFilter, signal?: AbortSignal) => {
    const response = await apiClient.get<{ data: PriceApproval[] }>('/price-approvals', {
      query: { status: filter === 'all' ? undefined : filter },
      signal,
    });
    return response.data;
  },
};
