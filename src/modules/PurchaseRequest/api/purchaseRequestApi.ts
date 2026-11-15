import { apiClient } from '@/core/api';

import type {
  ItemOption,
  OfficeOption,
  PageMeta,
  PurchaseRequestActionInput,
  PurchaseRequestDetail,
  PurchaseRequestDraft,
  PurchaseRequestListFilters,
  PurchaseRequestListItem,
  VendorOption,
} from '../types';
import { buildCreateForm } from './buildCreateForm';

const PAGE_SIZE = 15;
/** The server builds the workbook before it answers, so it gets longer than a normal request. */
const EXPORT_TIMEOUT_MS = 60_000;
/** Up to ten files of 20 MB and a document per item go up with the request. */
const CREATE_TIMEOUT_MS = 120_000;
/** A stored file can be large and the connection slow. */
const DOWNLOAD_TIMEOUT_MS = 60_000;

export const purchaseRequestApi = {
  list: async (
    filters: PurchaseRequestListFilters,
    search: string,
    page: number,
    signal?: AbortSignal,
  ) => {
    const response = await apiClient.get<PurchaseRequestListItem[], PageMeta>('/purchase-request', {
      query: {
        status: filters.status === 'all' ? undefined : filters.status,
        date_from: filters.dateFrom ?? undefined,
        date_to: filters.dateTo ?? undefined,
        search: search || undefined,
        page,
        per_page: PAGE_SIZE,
      },
      signal,
    });
    return { items: response.data, meta: response.meta };
  },

  /** The .xlsx of every request (but drafts) the user may see between two `YYYY-MM-DD` dates. */
  exportXlsx: (dateFrom: string, dateTo: string) =>
    apiClient.getFile('/purchase-request/export', {
      query: { date_from: dateFrom, date_to: dateTo },
      timeoutMs: EXPORT_TIMEOUT_MS,
    }),

  /** Pickers for the create form. Vendors and items answer at most 50 rows, narrowed by `search`. */
  vendors: async (search: string, signal?: AbortSignal) =>
    (
      await apiClient.get<VendorOption[]>('/purchase-request/vendors', {
        query: { search: search || undefined },
        signal,
      })
    ).data,

  /** Every office: the list is short, so it is not paged or searched on the server. */
  offices: async (signal?: AbortSignal) =>
    (await apiClient.get<OfficeOption[]>('/purchase-request/offices', { signal })).data,

  items: async (search: string, signal?: AbortSignal) =>
    (
      await apiClient.get<ItemOption[]>('/purchase-request/items', {
        query: { search: search || undefined },
        signal,
      })
    ).data,

  /** Resolves with the new request. 422: a field is wrong, and nothing was saved. */
  create: async (draft: PurchaseRequestDraft) =>
    (
      await apiClient.post<PurchaseRequestDetail>(
        '/purchase-request',
        await buildCreateForm(draft),
        { timeoutMs: CREATE_TIMEOUT_MS },
      )
    ).data,

  detail: async (uuid: string, signal?: AbortSignal) =>
    (await apiClient.get<PurchaseRequestDetail>(`/purchase-request/${uuid}`, { signal })).data,

  /** Resolves with the request as the server now has it. 409: it changed since `updatedAt`. */
  act: async (uuid: string, { action, remarks, updatedAt }: PurchaseRequestActionInput) =>
    (
      await apiClient.post<PurchaseRequestDetail>(`/purchase-request/${uuid}/actions`, {
        action,
        remarks: remarks || undefined,
        updated_at: updatedAt,
      })
    ).data,

  attachment: (uuid: string, attachmentId: number) =>
    apiClient.getFile(`/purchase-request/${uuid}/attachments/${attachmentId}/download`, {
      timeoutMs: DOWNLOAD_TIMEOUT_MS,
    }),

  itemDocument: (uuid: string, itemId: number) =>
    apiClient.getFile(`/purchase-request/${uuid}/items/${itemId}/document`, {
      timeoutMs: DOWNLOAD_TIMEOUT_MS,
    }),
};
