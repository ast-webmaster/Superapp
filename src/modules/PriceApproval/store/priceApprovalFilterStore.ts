import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';

import type { PriceApprovalFilter } from '../types';

const DEFAULT_FILTER: PriceApprovalFilter = 'AWAITING';

// Client-only UI state for this module. Server data lives in React Query, not here.
type FilterState = {
  filter: PriceApprovalFilter;
  setFilter: (filter: PriceApprovalFilter) => void;
};

export const usePriceApprovalFilter = create<FilterState>((set) => ({
  filter: DEFAULT_FILTER,
  setFilter: (filter) => set({ filter }),
}));

// The next user who signs in on this device starts from the default, not from this user's choice.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    usePriceApprovalFilter.setState({ filter: DEFAULT_FILTER });
  }
});
