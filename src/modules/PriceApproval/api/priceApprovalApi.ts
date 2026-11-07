import { apiClient } from '@/core/api';

import type {
  PageMeta,
  PriceApprovalActionInput,
  PriceApprovalDetail,
  PriceApprovalFilter,
  PriceApprovalListItem,
} from '../types';

const PAGE_SIZE = 15;

export const priceApprovalApi = {
  list: async (filter: PriceApprovalFilter, page: number, signal?: AbortSignal) => {
    const response = await apiClient.get<PriceApprovalListItem[], PageMeta>('/price-approval', {
      query: { status: filter === 'all' ? undefined : filter, page, per_page: PAGE_SIZE },
      signal,
    });
    return { items: response.data, meta: response.meta };
  },

  detail: async (uuid: string, signal?: AbortSignal) =>
    (await apiClient.get<PriceApprovalDetail>(`/price-approval/${uuid}`, { signal })).data,

  /** Resolves with the request as the server now has it. 409: it changed since `updatedAt`. */
  act: async (uuid: string, { action, remarks, updatedAt }: PriceApprovalActionInput) =>
    (
      await apiClient.post<PriceApprovalDetail>(`/price-approval/${uuid}/actions`, {
        action,
        remarks: remarks || undefined,
        updated_at: updatedAt,
      })
    ).data,
};
