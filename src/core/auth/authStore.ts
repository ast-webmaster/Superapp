import { create } from 'zustand';

import { setAccessToken, setUnauthorizedHandler } from '@/core/api';
import { secureStorage } from '@/core/storage';

import { authApi } from './authApi';
import type { AuthStatus, AuthUser, LoginCredentials } from './types';

const TOKEN_KEY = 'auth_token';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  /** Load the stored token and validate it. Call once at startup. */
  restore: () => Promise<void>;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  /** Drop the session locally (no server call). Used when the server rejects the token. */
  clearSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'restoring',
  user: null,

  restore: async () => {
    const token = await secureStorage.get(TOKEN_KEY);
    if (!token) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    setAccessToken(token);
    try {
      set({ status: 'authenticated', user: await authApi.me() });
    } catch {
      // A 401 already wiped the stored token via clearSession. Any other failure
      // (offline, 5xx) keeps it, so the next launch can try again.
      setAccessToken(null);
      set({ status: 'unauthenticated', user: null });
    }
  },

  signIn: async (credentials) => {
    const { token, user } = await authApi.login(credentials);
    await secureStorage.set(TOKEN_KEY, token);
    setAccessToken(token);
    set({ status: 'authenticated', user });
  },

  signOut: async () => {
    // Best effort: the local session must end even if the server cannot be reached.
    await authApi.logout().catch(() => {});
    await useAuthStore.getState().clearSession();
  },

  clearSession: async () => {
    setAccessToken(null);
    set({ status: 'unauthenticated', user: null });
    await secureStorage.remove(TOKEN_KEY);
  },
}));

setUnauthorizedHandler(() => void useAuthStore.getState().clearSession());

export const useAuthStatus = () => useAuthStore((state) => state.status);
export const useCurrentUser = () => useAuthStore((state) => state.user);
