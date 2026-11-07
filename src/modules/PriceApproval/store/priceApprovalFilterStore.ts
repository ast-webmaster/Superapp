import { create } from 'zustand';

import type { PriceApprovalFilter } from '../types';

// Client-only UI state for this module. Server data lives in React Query, not here.
type FilterState = {
  filter: PriceApprovalFilter;
  setFilter: (filter: PriceApprovalFilter) => void;
};

export const usePriceApprovalFilter = create<FilterState>((set) => ({
  filter: 'AWAITING',
  setFilter: (filter) => set({ filter }),
}));
