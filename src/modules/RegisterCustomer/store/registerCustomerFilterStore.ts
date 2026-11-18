import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';

import type { RegisterCustomerListFilters } from '../types';

export const DEFAULT_FILTERS: RegisterCustomerListFilters = {
  status: 'all',
  dateFrom: null,
  dateTo: null,
};

/** How many filter categories the sheet (not the status chips on the toolbar) narrows the list by. */
export function countSheetFilters(filters: RegisterCustomerListFilters) {
  return [
    filters.dateFrom !== null || filters.dateTo !== null,
    filters.status !== 'all',
  ].filter(Boolean).length;
}

// Client-only UI state for this module. Server data lives in React Query, not here.
type FilterState = {
  filters: RegisterCustomerListFilters;
  setFilters: (filters: Partial<RegisterCustomerListFilters>) => void;
};

export const useRegisterCustomerFilter = create<FilterState>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));

// The next user who signs in on this device starts from the default, not from this user's choice.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    useRegisterCustomerFilter.setState({ filters: DEFAULT_FILTERS });
  }
});
