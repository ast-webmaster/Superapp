import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';

import type { SalesVisitationListFilters } from '../types';

export const DEFAULT_FILTERS: SalesVisitationListFilters = {
  status: 'all',
  dateFrom: null,
  dateTo: null,
};

// Client-only UI state for this module. Server data lives in React Query, not here.
type FilterState = {
  filters: SalesVisitationListFilters;
  setFilters: (filters: Partial<SalesVisitationListFilters>) => void;
};

export const useSalesVisitationFilter = create<FilterState>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));

// The next user who signs in on this device starts from the default, not from this user's choice.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    useSalesVisitationFilter.setState({ filters: DEFAULT_FILTERS });
  }
});
