import { apiClient } from '@/core/api';

import type {
  CustomerOption,
  ExtendInput,
  PageMeta,
  ProductBorrowingActionInput,
  ProductBorrowingDetail,
  ProductBorrowingDraft,
  ProductBorrowingListFilters,
  ProductBorrowingListItem,
  ProductBorrowingOptions,
  StockOption,
} from '../types';
import { buildPayload } from './buildPayload';

const PAGE_SIZE = 15;
/** A PDF or an Excel sheet is built on the server and can be slow on a poor connection. */
const FILE_TIMEOUT_MS = 60_000;

export const productBorrowingApi = {
  list: async (
    filters: ProductBorrowingListFilters,
    search: string,
    page: number,
    signal?: AbortSignal,
  ) => {
    // The server wants both ends of the date range or neither.
    const { dateFrom, dateTo } = filters;
    const hasRange = dateFrom !== null && dateTo !== null;
    const response = await apiClient.get<ProductBorrowingListItem[], PageMeta>(
      '/product-borrowing',
      {
        query: {
          status: filters.status === 'all' ? undefined : filters.status,
          date_from: hasRange ? dateFrom : undefined,
          date_to: hasRange ? dateTo : undefined,
          search: search || undefined,
          page,
          per_page: PAGE_SIZE,
        },
        signal,
      },
    );
    return { items: response.data, meta: response.meta };
  },

  /** Warehouses, product managers and marketing people for the form. */
  options: async (signal?: AbortSignal) =>
    (await apiClient.get<ProductBorrowingOptions>('/product-borrowing/options', { signal })).data,

  /** At most 20 customers by name or code. */
  customers: async (search: string, signal?: AbortSignal) =>
    (
      await apiClient.get<CustomerOption[]>('/product-borrowing/customers', {
        query: { search: search || undefined },
        signal,
      })
    ).data,

  /** Products with stock in one warehouse, at most 20, narrowed by product code. */
  stock: async (warehouse: string, search: string, signal?: AbortSignal) =>
    (
      await apiClient.get<StockOption[]>('/product-borrowing/stock', {
        query: { warehouse, search: search || undefined },
        signal,
      })
    ).data,

  detail: async (uuid: string, signal?: AbortSignal) =>
    (await apiClient.get<ProductBorrowingDetail>(`/product-borrowing/${uuid}`, { signal })).data,

  /** Saves and submits in one call. 422: a field is wrong, and nothing was saved. */
  create: async (draft: ProductBorrowingDraft) =>
    (await apiClient.post<ProductBorrowingDetail>('/product-borrowing', buildPayload(draft))).data,

  /** Replaces the whole document. 409: it changed since `updatedAt` or is no longer in REVISE. */
  resubmit: async (uuid: string, draft: ProductBorrowingDraft, updatedAt: string) =>
    (
      await apiClient.put<ProductBorrowingDetail>(`/product-borrowing/${uuid}`, {
        ...buildPayload(draft),
        updated_at: updatedAt,
      })
    ).data,

  /** Resolves with the document as the server now has it. 409: it changed since `updatedAt`. */
  act: async (uuid: string, { action, remarks, updatedAt }: ProductBorrowingActionInput) =>
    (
      await apiClient.post<ProductBorrowingDetail>(`/product-borrowing/${uuid}/actions`, {
        action,
        remarks: remarks || undefined,
        updated_at: updatedAt,
      })
    ).data,

  /** Asks to keep the borrowed items longer. Applies to every item that is still borrowed. */
  extend: async (uuid: string, { endDate, reason, updatedAt }: ExtendInput) =>
    (
      await apiClient.post<ProductBorrowingDetail>(`/product-borrowing/${uuid}/extend`, {
        end_date: endDate,
        reason,
        updated_at: updatedAt,
      })
    ).data,

  pdf: (uuid: string) =>
    apiClient.getFile(`/product-borrowing/${uuid}/pdf`, { timeoutMs: FILE_TIMEOUT_MS }),

  exportXlsx: (dateFrom: string, dateTo: string) =>
    apiClient.getFile('/product-borrowing/export', {
      query: { date_from: dateFrom, date_to: dateTo },
      timeoutMs: FILE_TIMEOUT_MS,
    }),
};
