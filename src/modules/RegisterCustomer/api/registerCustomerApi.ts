import { apiClient } from '@/core/api';

import { buildCreateForm } from './buildCreateForm';
import type {
  PageMeta,
  RegisterCustomerActionInput,
  RegisterCustomerDetail,
  RegisterCustomerDraft,
  RegisterCustomerListFilters,
  RegisterCustomerListItem,
} from '../types';

const PAGE_SIZE = 15;
/** The server builds the workbook before it answers, so it gets longer than a normal request. */
const EXPORT_TIMEOUT_MS = 60_000;
/** Up to ten files of 2 MB go up with the request, which a slow connection needs longer for. */
const CREATE_TIMEOUT_MS = 60_000;
const DOWNLOAD_TIMEOUT_MS = 60_000;

export const registerCustomerApi = {
  list: async (
    filters: RegisterCustomerListFilters,
    search: string,
    page: number,
    signal?: AbortSignal,
  ) => {
    const response = await apiClient.get<RegisterCustomerListItem[], PageMeta>(
      '/register-customer',
      {
        query: {
          status: filters.status === 'all' ? undefined : filters.status,
          date_from: filters.dateFrom ?? undefined,
          date_to: filters.dateTo ?? undefined,
          search: search || undefined,
          page,
          per_page: PAGE_SIZE,
        },
        signal,
      },
    );
    return { items: response.data, meta: response.meta };
  },

  /** The .xlsx of every registration the user may see between two `YYYY-MM-DD` dates, both included. */
  exportXlsx: (dateFrom: string, dateTo: string) =>
    apiClient.getFile('/register-customer/export', {
      query: { date_from: dateFrom, date_to: dateTo },
      timeoutMs: EXPORT_TIMEOUT_MS,
    }),

  /** Resolves with the new registration. 422: a field is wrong, and nothing was saved. */
  create: async (draft: RegisterCustomerDraft) =>
    (
      await apiClient.post<RegisterCustomerDetail>(
        '/register-customer',
        await buildCreateForm(draft),
        { timeoutMs: CREATE_TIMEOUT_MS },
      )
    ).data,

  detail: async (uuid: string, signal?: AbortSignal) =>
    (await apiClient.get<RegisterCustomerDetail>(`/register-customer/${uuid}`, { signal })).data,

  /** Resolves with the registration as the server now has it. 409: it changed since `updatedAt`. */
  act: async (
    uuid: string,
    { action, remarks, customerCode, updatedAt }: RegisterCustomerActionInput,
  ) =>
    (
      await apiClient.post<RegisterCustomerDetail>(`/register-customer/${uuid}/actions`, {
        action,
        remarks: remarks || undefined,
        customer_code: customerCode || undefined,
        updated_at: updatedAt,
      })
    ).data,

  document: (uuid: string, key: string) =>
    apiClient.getFile(`/register-customer/${uuid}/documents/${key}/download`, {
      timeoutMs: DOWNLOAD_TIMEOUT_MS,
    }),

  attachment: (uuid: string, attachmentId: number) =>
    apiClient.getFile(`/register-customer/${uuid}/attachments/${attachmentId}/download`, {
      timeoutMs: DOWNLOAD_TIMEOUT_MS,
    }),
};
