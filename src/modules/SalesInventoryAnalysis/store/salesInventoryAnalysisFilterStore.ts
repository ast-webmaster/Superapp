import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';

import type { AnalysisSelection } from '../types';

// Client-only UI state for this module. Server data lives in React Query, not here.
type FilterState = AnalysisSelection & {
  setSelection: (selection: AnalysisSelection) => void;
};

const NONE: AnalysisSelection = { branch: [], brand: [] };

export const useSalesInventoryAnalysisFilter = create<FilterState>((set) => ({
  ...NONE,
  setSelection: (selection) => set(selection),
}));

// The next user who signs in on this device starts unfiltered.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    useSalesInventoryAnalysisFilter.setState(NONE);
  }
});
