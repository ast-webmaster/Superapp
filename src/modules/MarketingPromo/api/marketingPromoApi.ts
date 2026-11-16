import { apiClient } from '@/core/api';

import type {
  MarketingPromoActionInput,
  MarketingPromoDetail,
  MarketingPromoKind,
  MarketingPromoListFilters,
  MarketingPromoListItem,
  PageMeta,
} from '../types';

const PAGE_SIZE = 15;
/** The server builds the workbook before it answers, so it gets longer than a normal request. */
const EXPORT_TIMEOUT_MS = 60_000;
/** The server renders the PDF before it answers, and an attachment can be large. */
const DOWNLOAD_TIMEOUT_MS = 60_000;

const basePath = (kind: MarketingPromoKind) =>
  kind === 'combination' ? '/marketing-promo-combination' : '/marketing-promo';

export const marketingPromoApi = {
  list: async (
    kind: MarketingPromoKind,
    filters: MarketingPromoListFilters,
    search: string,
    page: number,
    signal?: AbortSignal,
  ) => {
    const response = await apiClient.get<MarketingPromoListItem[], PageMeta>(basePath(kind), {
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

  /** The .xlsx of every promo (but drafts) the user may see between two `YYYY-MM-DD` dates. */
  exportXlsx: (kind: MarketingPromoKind, dateFrom: string, dateTo: string) =>
    apiClient.getFile(`${basePath(kind)}/export`, {
      query: { date_from: dateFrom, date_to: dateTo },
      timeoutMs: EXPORT_TIMEOUT_MS,
    }),

  detail: async (kind: MarketingPromoKind, uuid: string, signal?: AbortSignal) =>
    (await apiClient.get<MarketingPromoDetail>(`${basePath(kind)}/${uuid}`, { signal })).data,

  /** The printable PDF of one promo. */
  pdf: (kind: MarketingPromoKind, uuid: string) =>
    apiClient.getFile(`${basePath(kind)}/${uuid}/pdf`, { timeoutMs: DOWNLOAD_TIMEOUT_MS }),

  attachment: (kind: MarketingPromoKind, uuid: string, attachmentId: number) =>
    apiClient.getFile(`${basePath(kind)}/${uuid}/attachments/${attachmentId}/download`, {
      timeoutMs: DOWNLOAD_TIMEOUT_MS,
    }),

  /** The promo's mechanism document. */
  mechanism: (kind: MarketingPromoKind, uuid: string) =>
    apiClient.getFile(`${basePath(kind)}/${uuid}/mechanism/download`, {
      timeoutMs: DOWNLOAD_TIMEOUT_MS,
    }),

  /** Resolves with the promo as the server now has it. 409: it changed since `updatedAt`. */
  act: async (
    kind: MarketingPromoKind,
    uuid: string,
    { action, remarks, updatedAt }: MarketingPromoActionInput,
  ) =>
    (
      await apiClient.post<MarketingPromoDetail>(`${basePath(kind)}/${uuid}/actions`, {
        action,
        remarks: remarks || undefined,
        updated_at: updatedAt,
      })
    ).data,
};
