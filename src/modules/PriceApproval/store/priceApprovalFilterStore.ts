import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';

import type { PriceApprovalListFilters } from '../types';

export const DEFAULT_FILTERS: PriceApprovalListFilters = {
  status: 'AWAITING',
  tier: 'all',
  dateFrom: null,
  dateTo: null,
  minTotal: null,
  maxTotal: null,
};

/** True when the filter sheet (not the status chips on the toolbar) narrows the list. */
export function hasSheetFilters(filters: PriceApprovalListFilters) {
  return (
    filters.tier !== 'all' ||
    filters.dateFrom !== null ||
    filters.minTotal !== null ||
    filters.maxTotal !== null ||
    (filters.status !== 'AWAITING' && filters.status !== 'all')
  );
}

// Client-only UI state for this module. Server data lives in React Query, not here.
type FilterState = {
  filters: PriceApprovalListFilters;
  setFilters: (filters: Partial<PriceApprovalListFilters>) => void;
};

export const usePriceApprovalFilter = create<FilterState>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));

// The next user who signs in on this device starts from the default, not from this user's choice.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    usePriceApprovalFilter.setState({ filters: DEFAULT_FILTERS });
  }
});
