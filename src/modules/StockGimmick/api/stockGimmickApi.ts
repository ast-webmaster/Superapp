import { apiClient } from '@/core/api';

import type { PageMeta, StockDetail, StockListItem, StockPage, StockTrack } from '../types';

const PAGE_SIZE = 15;
/** The server builds the workbook before it answers, so it gets longer than a normal request. */
const EXPORT_TIMEOUT_MS = 60_000;

const PATH = '/stock-gimmick';

export const stockGimmickApi = {
  list: async (search: string, page: number, signal?: AbortSignal): Promise<StockPage> => {
    const { data, meta } = await apiClient.get<StockListItem[], PageMeta>(PATH, {
      query: { search: search || undefined, page, per_page: PAGE_SIZE },
      signal,
    });
    return { items: data, meta };
  },

  detail: async (id: string, signal?: AbortSignal) =>
    (await apiClient.get<StockDetail>(`${PATH}/${id}`, { signal })).data,

  /** The whole history of one row, not paged, so the running balance stays complete. */
  movements: async (id: string, signal?: AbortSignal) =>
    (await apiClient.get<StockTrack>(`${PATH}/${id}/movements`, { signal })).data,

  /** The .xlsx of every row the user may see, unfiltered. */
  exportXlsx: () => apiClient.getFile(`${PATH}/export`, { timeoutMs: EXPORT_TIMEOUT_MS }),
};
