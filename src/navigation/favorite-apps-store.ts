import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';
import { secureStorage } from '@/core/storage';

const storageKey = (userId: number) => `favorite_apps_${userId}`;

type FavoriteAppsState = {
  /** The favorites have been read from the device, so Home can stop showing a placeholder. */
  ready: boolean;
  /** Module ids in the user's order. `null` until the user changes them: Home then shows every app. */
  ids: string[] | null;
  save: (ids: string[]) => void;
};

// The choice belongs to the person on this device, not to the server. It is a short list of
// module ids, so it goes in the existing key-value storage and not in the query cache.
export const useFavoriteAppsStore = create<FavoriteAppsState>((set) => ({
  ready: false,
  ids: null,
  save: (ids) => {
    set({ ids });
    const user = useAuthStore.getState().user;
    // A write that fails only costs the choice after the next launch.
    if (user) void secureStorage.set(storageKey(user.id), JSON.stringify(ids)).catch(() => {});
  },
}));

function parse(value: string | null): string[] | null {
  try {
    const ids: unknown = value ? JSON.parse(value) : null;
    return Array.isArray(ids) && ids.every((id) => typeof id === 'string') ? ids : null;
  } catch {
    return null;
  }
}

async function load(userId: number) {
  const value = await secureStorage.get(storageKey(userId)).catch(() => null);
  // The user may have signed out, or someone else in, while the read was running.
  if (useAuthStore.getState().user?.id !== userId) return;
  useFavoriteAppsStore.setState({ ready: true, ids: parse(value) });
}

// Read the favorites of whoever signs in, and forget them when that session ends, so the next
// user on this device starts from the default and never sees this user's choice.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id === previous.user?.id) return;
  useFavoriteAppsStore.setState({ ready: false, ids: null });
  if (state.status === 'authenticated' && state.user) void load(state.user.id);
});
const current = useAuthStore.getState().user;
if (current) void load(current.id);
