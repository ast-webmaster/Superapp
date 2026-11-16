import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';

import type { PurchaseRequestListFilters } from '../types';

export const DEFAULT_FILTERS: PurchaseRequestListFilters = {
  status: 'AWAITING',
  dateFrom: null,
  dateTo: null,
};

/** True when the filter sheet (not the status chips on the toolbar) narrows the list. */
export function countSheetFilters(filters: PurchaseRequestListFilters) {
  return [
    filters.dateFrom !== null || filters.dateTo !== null,
    filters.status !== 'AWAITING' && filters.status !== 'all',
  ].filter(Boolean).length;
}

// Client-only UI state for this module. Server data lives in React Query, not here.
type FilterState = {
  filters: PurchaseRequestListFilters;
  setFilters: (filters: Partial<PurchaseRequestListFilters>) => void;
};

export const usePurchaseRequestFilter = create<FilterState>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));

// The next user who signs in on this device starts from the default, not from this user's choice.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    usePurchaseRequestFilter.setState({ filters: DEFAULT_FILTERS });
  }
});
