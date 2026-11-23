import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { salesInventoryAnalysisApi } from '../api/salesInventoryAnalysisApi';
import { salesInventoryAnalysisKeys } from '../api/salesInventoryAnalysisKeys';
import { useSalesInventoryAnalysisFilter } from '../store/salesInventoryAnalysisFilterStore';
import type { AnalysisSelection } from '../types';

/** The branches and brands the user chose. A new array only when the choice changes. */
export function useAnalysisSelection(): AnalysisSelection {
  const branch = useSalesInventoryAnalysisFilter((state) => state.branch);
  const brand = useSalesInventoryAnalysisFilter((state) => state.brand);
  return { branch, brand };
}

// Each view is its own query: only the open view is mounted, so only it is requested. The
// figures are read-only and the server caches them, so the default 60 s `staleTime` applies.
// While a new filter loads, the previous answer stays on screen instead of the skeleton.

export function useInventory() {
  const selection = useAnalysisSelection();
  return useQuery({
    queryKey: salesInventoryAnalysisKeys.inventory(selection),
    queryFn: ({ signal }) => salesInventoryAnalysisApi.inventory(selection, signal),
    placeholderData: keepPreviousData,
  });
}

export function useInactiveDealers() {
  const selection = useAnalysisSelection();
  return useQuery({
    queryKey: salesInventoryAnalysisKeys.inactiveDealers(selection),
    queryFn: ({ signal }) => salesInventoryAnalysisApi.inactiveDealers(selection, signal),
    placeholderData: keepPreviousData,
  });
}

export function useDealerActivity() {
  const selection = useAnalysisSelection();
  return useQuery({
    queryKey: salesInventoryAnalysisKeys.dealerActivity(selection),
    queryFn: ({ signal }) => salesInventoryAnalysisApi.dealerActivity(selection, signal),
    placeholderData: keepPreviousData,
  });
}

export function useAchievement() {
  const selection = useAnalysisSelection();
  return useQuery({
    queryKey: salesInventoryAnalysisKeys.achievement(selection),
    queryFn: ({ signal }) => salesInventoryAnalysisApi.achievement(selection, signal),
    placeholderData: keepPreviousData,
  });
}

/** The branch and brand choices and the status legend. Loaded when the screen opens. */
export function useAnalysisFilters(enabled = true) {
  return useQuery({
    queryKey: salesInventoryAnalysisKeys.filters(),
    queryFn: ({ signal }) => salesInventoryAnalysisApi.filters(signal),
    enabled,
  });
}
