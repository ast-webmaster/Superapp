import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';

import type { MarketingPromoKind, MarketingPromoListFilters } from '../types';

export const DEFAULT_FILTERS: MarketingPromoListFilters = {
  status: ['AWAITING'],
  tier: [],
  dateFrom: null,
  dateTo: null,
};

/** How many filter categories the sheet (not the status chips on the toolbar) narrows the list by. */
export function countSheetFilters(filters: MarketingPromoListFilters) {
  const toolbarStatus =
    filters.status.length === 0 ||
    (filters.status.length === 1 && filters.status[0] === 'AWAITING');
  return [
    filters.dateFrom !== null || filters.dateTo !== null,
    filters.tier.length > 0,
    !toolbarStatus,
  ].filter(Boolean).length;
}

// Client-only UI state for this module. Server data lives in React Query, not here.
type FilterState = {
  kind: MarketingPromoKind;
  filters: MarketingPromoListFilters;
  setKind: (kind: MarketingPromoKind) => void;
  setFilters: (filters: Partial<MarketingPromoListFilters>) => void;
};

const INITIAL = { kind: 'single', filters: DEFAULT_FILTERS } as const;

export const useMarketingPromoFilter = create<FilterState>((set) => ({
  ...INITIAL,
  setKind: (kind) => set({ kind }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));

// The next user who signs in on this device starts from the default, not from this user's choice.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    useMarketingPromoFilter.setState(INITIAL);
  }
});
