import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';

// Client-only UI state for this module. Server data lives in React Query, not here.
type AmountState = {
  /** Show rupiah figures in full instead of the short "Jt / Mil / Tri" form. */
  fullAmounts: boolean;
  setFullAmounts: (fullAmounts: boolean) => void;
};

export const useLaporanPenjualanAmounts = create<AmountState>((set) => ({
  fullAmounts: false,
  setFullAmounts: (fullAmounts) => set({ fullAmounts }),
}));

// The next user who signs in on this device starts from the default, not from this user's choice.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    useLaporanPenjualanAmounts.setState({ fullAmounts: false });
  }
});
