import { apiClient } from '@/core/api';
import { toUploadBlob } from '@/core/files';

import type {
  MarketingActivityActionInput,
  MarketingActivityDetail,
  MarketingActivityKind,
  MarketingActivityListFilters,
  MarketingActivityListItem,
  PageMeta,
} from '../types';

const PAGE_SIZE = 15;
/** The server builds the workbook before it answers, so it gets longer than a normal request. */
const EXPORT_TIMEOUT_MS = 60_000;
/** A claim carries a proof file of up to 10 MB. */
const CLAIM_TIMEOUT_MS = 60_000;

/** The server renders the PDF before it answers, and an attachment can be large. */
const DOWNLOAD_TIMEOUT_MS = 60_000;

const basePath = (kind: MarketingActivityKind) =>
  kind === 'combination' ? '/marketing-activity-combination' : '/marketing-activity';

export const marketingActivityApi = {
  list: async (
    kind: MarketingActivityKind,
    filters: MarketingActivityListFilters,
    search: string,
    page: number,
    signal?: AbortSignal,
  ) => {
    const response = await apiClient.get<MarketingActivityListItem[], PageMeta>(basePath(kind), {
      query: {
        // The backend takes a comma-separated list.
        status: filters.status.join(',') || undefined,
        tier: filters.tier.join(',') || undefined,
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

  /** The .xlsx of every activity (but drafts) the user may see between two `YYYY-MM-DD` dates. */
  exportXlsx: (kind: MarketingActivityKind, dateFrom: string, dateTo: string) =>
    apiClient.getFile(`${basePath(kind)}/export`, {
      query: { date_from: dateFrom, date_to: dateTo },
      timeoutMs: EXPORT_TIMEOUT_MS,
    }),

  detail: async (kind: MarketingActivityKind, uuid: string, signal?: AbortSignal) =>
    (await apiClient.get<MarketingActivityDetail>(`${basePath(kind)}/${uuid}`, { signal })).data,

  /** The printable PDF of one activity. */
  pdf: (kind: MarketingActivityKind, uuid: string) =>
    apiClient.getFile(`${basePath(kind)}/${uuid}/pdf`, { timeoutMs: DOWNLOAD_TIMEOUT_MS }),

  attachment: (kind: MarketingActivityKind, uuid: string, attachmentId: number) =>
    apiClient.getFile(`${basePath(kind)}/${uuid}/attachments/${attachmentId}/download`, {
      timeoutMs: DOWNLOAD_TIMEOUT_MS,
    }),

  /**
   * Resolves with the activity as the server now has it. 409: it changed since `updatedAt`.
   * A claim goes as multipart because it carries the proof file; every other action is JSON.
   */
  act: async (
    kind: MarketingActivityKind,
    uuid: string,
    { action, remarks, updatedAt, file }: MarketingActivityActionInput,
  ) => {
    const path = `${basePath(kind)}/${uuid}/actions`;
    if (!file) {
      return (
        await apiClient.post<MarketingActivityDetail>(path, {
          action,
          remarks: remarks || undefined,
          updated_at: updatedAt,
        })
      ).data;
    }
    const form = new FormData();
    form.append('action', action);
    if (remarks) form.append('remarks', remarks);
    form.append('updated_at', updatedAt);
    form.append('file', await toUploadBlob(file), file.name);
    return (
      await apiClient.post<MarketingActivityDetail>(path, form, { timeoutMs: CLAIM_TIMEOUT_MS })
    ).data;
  },
};
