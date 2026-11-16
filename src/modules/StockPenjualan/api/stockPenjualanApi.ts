import { apiClient } from '@/core/api';

import type {
  StockAllRow,
  StockCategory,
  StockFilters,
  StockMeta,
  StockPage,
  StockSalesRow,
} from '../types';

const PAGE_SIZE = 15;
/** The server builds the workbook before it answers, so it gets longer than a normal request. */
const EXPORT_TIMEOUT_MS = 60_000;

// The backend module is called StockEsales, so its path is `stock-esales`.
const PATH = '/stock-esales';

export const stockPenjualanApi = {
  /** `meta.view` tells which row shape `data` holds; each row is tagged with it as `kind`. */
  list: async (
    filters: StockFilters,
    search: string,
    page: number,
    signal?: AbortSignal,
  ): Promise<StockPage> => {
    const response = await apiClient.get<StockSalesRow[] | StockAllRow[], StockMeta>(PATH, {
      query: {
        search: search || undefined,
        category_code: filters.categoryCode ?? undefined,
        type: filters.type,
        page,
        per_page: PAGE_SIZE,
      },
      signal,
    });
    const { meta } = response;
    const items =
      meta.view === 'sales'
        ? (response.data as StockSalesRow[]).map((row) => ({ ...row, kind: 'sales' as const }))
        : (response.data as StockAllRow[]).map((row) => ({ ...row, kind: 'all' as const }));
    return { items, meta };
  },

  categories: async (signal?: AbortSignal) =>
    (await apiClient.get<StockCategory[]>(`${PATH}/categories`, { signal })).data,

  /** The .xlsx the server picks for the user's permission, unfiltered. */
  exportXlsx: () => apiClient.getFile(`${PATH}/export`, { timeoutMs: EXPORT_TIMEOUT_MS }),
};
