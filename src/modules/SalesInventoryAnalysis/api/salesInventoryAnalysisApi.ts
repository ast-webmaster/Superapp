import { apiClient } from '@/core/api';

import type {
  AnalysisFilters,
  AnalysisSelection,
  Achievement,
  DealerActivity,
  InactiveDealers,
  Inventory,
} from '../types';

const PATH = '/sales-inventory-analysis';

// The server reads each as an array; an empty one is left out, which means "everything in scope".
const selectionQuery = ({ branch, brand }: AnalysisSelection) => ({
  branch: branch.length > 0 ? branch : undefined,
  brand: brand.length > 0 ? brand : undefined,
});

// `periode` and `tanggal` are left to the server: the last full month and today.
export const salesInventoryAnalysisApi = {
  filters: async (signal?: AbortSignal) =>
    (await apiClient.get<AnalysisFilters>(`${PATH}/filters`, { signal })).data,

  inventory: async (selection: AnalysisSelection, signal?: AbortSignal) =>
    (
      await apiClient.get<Inventory>(`${PATH}/inventory`, {
        query: selectionQuery(selection),
        signal,
      })
    ).data,

  inactiveDealers: async (selection: AnalysisSelection, signal?: AbortSignal) =>
    (
      await apiClient.get<InactiveDealers>(`${PATH}/sales/dealer-tanpa-transaksi`, {
        query: selectionQuery(selection),
        signal,
      })
    ).data,

  dealerActivity: async (selection: AnalysisSelection, signal?: AbortSignal) =>
    (
      await apiClient.get<DealerActivity>(`${PATH}/sales/dealer-activity`, {
        query: selectionQuery(selection),
        signal,
      })
    ).data,

  achievement: async (selection: AnalysisSelection, signal?: AbortSignal) =>
    (
      await apiClient.get<Achievement>(`${PATH}/sales/achievement-vs-target`, {
        query: selectionQuery(selection),
        signal,
      })
    ).data,
};
