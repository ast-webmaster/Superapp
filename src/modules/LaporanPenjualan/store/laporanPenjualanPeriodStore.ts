import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';

// Client-only UI state for this module. Server data lives in React Query, not here.
type PeriodState = {
  /** `YYYY-MM` the user picked, or `null` for the server's default period. */
  period: string | null;
  setPeriod: (period: string | null) => void;
};

export const useLaporanPenjualanPeriod = create<PeriodState>((set) => ({
  period: null,
  setPeriod: (period) => set({ period }),
}));

// The next user who signs in on this device starts from the default, not from this user's choice.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    useLaporanPenjualanPeriod.setState({ period: null });
  }
});
