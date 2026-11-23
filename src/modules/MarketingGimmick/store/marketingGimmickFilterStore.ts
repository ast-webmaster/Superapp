import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';

import type { GimmickFlow, GimmickListFilters } from '../types';

export const DEFAULT_FILTERS: GimmickListFilters = {
  status: 'all',
  dateFrom: null,
  dateTo: null,
};

const DEFAULT_STATE: Record<GimmickFlow, GimmickListFilters> = {
  inbound: DEFAULT_FILTERS,
  request: DEFAULT_FILTERS,
};

// Client-only UI state for this module. Server data lives in React Query, not here. Each flow
// keeps its own filters, since their statuses differ.
type FilterState = {
  filters: Record<GimmickFlow, GimmickListFilters>;
  setFilters: (flow: GimmickFlow, filters: Partial<GimmickListFilters>) => void;
};

export const useGimmickFilter = create<FilterState>((set) => ({
  filters: DEFAULT_STATE,
  setFilters: (flow, filters) =>
    set((state) => ({
      filters: { ...state.filters, [flow]: { ...state.filters[flow], ...filters } },
    })),
}));

// The next user who signs in on this device starts from the default, not from this user's choice.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    useGimmickFilter.setState({ filters: DEFAULT_STATE });
  }
});
