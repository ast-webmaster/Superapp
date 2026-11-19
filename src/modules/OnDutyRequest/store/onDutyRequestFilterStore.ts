import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';

import type { OnDutyRequestListFilters } from '../types';

export const DEFAULT_FILTERS: OnDutyRequestListFilters = {
  status: 'AWAITING',
  dateFrom: null,
  dateTo: null,
};

/** Counts what the filter sheet (not the status chips on the toolbar) narrows the list by. */
export function countSheetFilters(filters: OnDutyRequestListFilters) {
  return [
    filters.dateFrom !== null || filters.dateTo !== null,
    filters.status !== 'AWAITING' && filters.status !== 'all',
  ].filter(Boolean).length;
}

// Client-only UI state for this module. Server data lives in React Query, not here.
type FilterState = {
  filters: OnDutyRequestListFilters;
  setFilters: (filters: Partial<OnDutyRequestListFilters>) => void;
};

export const useOnDutyRequestFilter = create<FilterState>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));

// The next user who signs in on this device starts from the default, not from this user's choice.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    useOnDutyRequestFilter.setState({ filters: DEFAULT_FILTERS });
  }
});
