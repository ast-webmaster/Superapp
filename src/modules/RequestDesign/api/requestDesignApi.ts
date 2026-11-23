import { apiClient } from '@/core/api';
import { toUploadBlob } from '@/core/files';

import type {
  AnalyticsPeriod,
  PageMeta,
  RequestDesignActionInput,
  RequestDesignAnalytics,
  RequestDesignDetail,
  RequestDesignDraft,
  RequestDesignListFilters,
  RequestDesignListItem,
  RequestDesignOptions,
  ResultInput,
} from '../types';
import { buildForm } from './buildForm';

const PAGE_SIZE = 15;
/** Files go up with the document and an Excel sheet is built on the server: both can be slow. */
const FILE_TIMEOUT_MS = 60_000;

const BASE = '/request-design';

export const requestDesignApi = {
  list: async (
    filters: RequestDesignListFilters,
    search: string,
    page: number,
    signal?: AbortSignal,
  ) => {
    // The server wants both ends of the date range or neither.
    const { dateFrom, dateTo } = filters;
    const hasRange = dateFrom !== null && dateTo !== null;
    const response = await apiClient.get<RequestDesignListItem[], PageMeta>(BASE, {
      query: {
        status: filters.status === 'all' ? undefined : filters.status,
        priority: filters.priority === 'all' ? undefined : filters.priority,
        date_from: hasRange ? dateFrom : undefined,
        date_to: hasRange ? dateTo : undefined,
        search: search || undefined,
        page,
        per_page: PAGE_SIZE,
      },
      signal,
    });
    return { items: response.data, meta: response.meta };
  },

  /** Brands, item choices, designers and point categories. Not paged. */
  options: async (signal?: AbortSignal) =>
    (await apiClient.get<RequestDesignOptions>(`${BASE}/options`, { signal })).data,

  detail: async (uuid: string, signal?: AbortSignal) =>
    (await apiClient.get<RequestDesignDetail>(`${BASE}/${uuid}`, { signal })).data,

  /** Saves and submits in one call. 422: a field is wrong, and nothing was saved. */
  create: async (draft: RequestDesignDraft) =>
    (
      await apiClient.post<RequestDesignDetail>(BASE, await buildForm(draft), {
        timeoutMs: FILE_TIMEOUT_MS,
      })
    ).data,

  /** Replaces the whole document. 409: it changed since `updatedAt` or was picked meanwhile. */
  update: async (uuid: string, draft: RequestDesignDraft, updatedAt: string) =>
    (
      await apiClient.post<RequestDesignDetail>(
        `${BASE}/${uuid}`,
        await buildForm(draft, updatedAt),
        { timeoutMs: FILE_TIMEOUT_MS },
      )
    ).data,

  /** Resolves with the document as the server now has it. 409: it changed since `updatedAt`. */
  act: async (uuid: string, input: RequestDesignActionInput) =>
    (
      await apiClient.post<RequestDesignDetail>(`${BASE}/${uuid}/actions`, {
        action: input.action,
        updated_at: input.updatedAt,
        remarks: input.remarks || undefined,
        due_date: input.dueDate,
        assign_to: input.assignTo,
        priority: input.priority,
        points: input.points?.map(({ categoryUuid, qty }) => ({
          category_uuid: categoryUuid,
          qty,
        })),
      })
    ).data,

  /** The designer hands in the work: a link (JSON) or a file (multipart). */
  submitResult: async (uuid: string, input: ResultInput) => {
    const body =
      input.fileType === 'LINK'
        ? { updated_at: input.updatedAt, file_type: 'LINK', file_link: input.fileLink }
        : await resultForm(input);
    return (
      await apiClient.post<RequestDesignDetail>(`${BASE}/${uuid}/submit-file`, body, {
        timeoutMs: FILE_TIMEOUT_MS,
      })
    ).data;
  },

  /** The designer's file. Only when the detail's `result.type` is `FILE`. */
  result: (uuid: string) =>
    apiClient.getFile(`${BASE}/${uuid}/file`, { timeoutMs: FILE_TIMEOUT_MS }),

  /** A reference file of one item. `slot` comes from the detail's references. */
  reference: (uuid: string, itemId: number, slot: number) =>
    apiClient.getFile(`${BASE}/${uuid}/items/${itemId}/references/${slot}`, {
      timeoutMs: FILE_TIMEOUT_MS,
    }),

  /** Designers' points in one month against their target, and the trend of the last three months. */
  analytics: async ({ month, year }: AnalyticsPeriod, signal?: AbortSignal) =>
    (
      await apiClient.get<RequestDesignAnalytics>(`${BASE}/analytics`, {
        query: { month, year },
        signal,
      })
    ).data,

  exportXlsx: (dateFrom: string, dateTo: string) =>
    apiClient.getFile(`${BASE}/export`, {
      query: { date_from: dateFrom, date_to: dateTo },
      timeoutMs: FILE_TIMEOUT_MS,
    }),
};

async function resultForm(input: Extract<ResultInput, { fileType: 'FILE' }>) {
  const form = new FormData();
  form.append('updated_at', input.updatedAt);
  form.append('file_type', 'FILE');
  form.append('file_upload', await toUploadBlob(input.file), input.file.name);
  return form;
}
