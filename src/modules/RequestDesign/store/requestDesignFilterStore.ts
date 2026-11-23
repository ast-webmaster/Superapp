import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';

import type { RequestDesignListFilters } from '../types';

export const DEFAULT_FILTERS: RequestDesignListFilters = {
  status: 'all',
  priority: 'all',
  dateFrom: null,
  dateTo: null,
};

// Client-only UI state for this module. Server data lives in React Query, not here.
type FilterState = {
  filters: RequestDesignListFilters;
  setFilters: (filters: Partial<RequestDesignListFilters>) => void;
};

export const useRequestDesignFilter = create<FilterState>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));

// The next user who signs in on this device starts from the default, not from this user's choice.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    useRequestDesignFilter.setState({ filters: DEFAULT_FILTERS });
  }
});
