import { apiClient } from '@/core/api';

import { buildCreateForm } from './buildCreateForm';
import type {
  CustomerOption,
  ManagerOption,
  PageMeta,
  PriceApprovalDraft,
  ProductOption,
  PriceApprovalActionInput,
  PriceApprovalDetail,
  PriceApprovalListFilters,
  PriceApprovalListItem,
} from '../types';

const PAGE_SIZE = 15;
/** The server builds the workbook before it answers, so it gets longer than a normal request. */
const EXPORT_TIMEOUT_MS = 60_000;

/** Up to ten files of 5 MB go up with the request, which a slow connection needs longer for. */
const CREATE_TIMEOUT_MS = 60_000;

export const priceApprovalApi = {
  list: async (
    filters: PriceApprovalListFilters,
    search: string,
    page: number,
    signal?: AbortSignal,
  ) => {
    const response = await apiClient.get<PriceApprovalListItem[], PageMeta>('/price-approval', {
      query: {
        status: filters.status === 'all' ? undefined : filters.status,
        last_updated_tier: filters.tier === 'all' ? undefined : filters.tier,
        date_from: filters.dateFrom ?? undefined,
        date_to: filters.dateTo ?? undefined,
        min_total: filters.minTotal ?? undefined,
        max_total: filters.maxTotal ?? undefined,
        search: search || undefined,
        page,
        per_page: PAGE_SIZE,
      },
      signal,
    });
    return { items: response.data, meta: response.meta };
  },

  /** The .xlsx of every request the user may see between two `YYYY-MM-DD` dates, both included. */
  exportXlsx: (dateFrom: string, dateTo: string) =>
    apiClient.getFile('/price-approval/export', {
      query: { date_from: dateFrom, date_to: dateTo },
      timeoutMs: EXPORT_TIMEOUT_MS,
    }),

  /** Pickers for the create form. Each answers at most 50 rows, narrowed by `search`. */
  customers: async (search: string, signal?: AbortSignal) =>
    (
      await apiClient.get<CustomerOption[]>('/price-approval/customers', {
        query: { search: search || undefined },
        signal,
      })
    ).data,

  products: async (search: string, signal?: AbortSignal) =>
    (
      await apiClient.get<ProductOption[]>('/price-approval/products', {
        query: { search: search || undefined },
        signal,
      })
    ).data,

  productManagers: async (search: string, signal?: AbortSignal) =>
    (
      await apiClient.get<ManagerOption[]>('/price-approval/product-managers', {
        query: { search: search || undefined },
        signal,
      })
    ).data,

  /** Resolves with the new request. 422: a field is wrong, and nothing was saved. */
  create: async (draft: PriceApprovalDraft) =>
    (
      await apiClient.post<PriceApprovalDetail>('/price-approval', await buildCreateForm(draft), {
        timeoutMs: CREATE_TIMEOUT_MS,
      })
    ).data,

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
