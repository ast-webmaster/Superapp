import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';

import type { AuditListFilters } from '../types';

export const DEFAULT_FILTERS: AuditListFilters = {
  tab: 'all',
  status: 'all',
  year: null,
  month: null,
};

/** How many categories the sheet (not the tab chips on the toolbar) narrows the list by. */
export function countSheetFilters(filters: AuditListFilters) {
  return [filters.status !== 'all', filters.year !== null].filter(Boolean).length;
}

// Client-only UI state for this module. Server data lives in React Query, not here.
type FilterState = {
  filters: AuditListFilters;
  setFilters: (filters: Partial<AuditListFilters>) => void;
};

export const useAuditFilter = create<FilterState>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));

// The next user who signs in on this device starts from the default, not from this user's choice.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    useAuditFilter.setState({ filters: DEFAULT_FILTERS });
  }
});
