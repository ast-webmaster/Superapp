import type { StockFilters } from '../types';

/** Every React Query key of this module. The first segment is the manifest id. */
export const stockPenjualanKeys = {
  all: ['stock-penjualan'] as const,
  lists: () => [...stockPenjualanKeys.all, 'list'] as const,
  list: (filters: StockFilters, search: string) =>
    [...stockPenjualanKeys.lists(), filters, search] as const,
  categories: () => [...stockPenjualanKeys.all, 'categories'] as const,
};
