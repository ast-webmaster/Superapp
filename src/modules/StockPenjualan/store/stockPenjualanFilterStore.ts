import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';

import type { StockFilters } from '../types';

export const DEFAULT_FILTERS: StockFilters = { categoryCode: null, type: 'AVAILABLE' };

// Client-only UI state for this module. Server data lives in React Query, not here.
type FilterState = {
  filters: StockFilters;
  setFilters: (filters: Partial<StockFilters>) => void;
};

export const useStockPenjualanFilter = create<FilterState>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));

// The next user who signs in on this device starts from the default, not from this user's choice.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    useStockPenjualanFilter.setState({ filters: DEFAULT_FILTERS });
  }
});
