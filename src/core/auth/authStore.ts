import { create } from 'zustand';

import { setAccessToken, setUnauthorizedHandler } from '@/core/api';
import { toAppError } from '@/core/errors';
import { secureStorage } from '@/core/storage';

import { authApi } from './authApi';
import { getDeviceName } from './deviceName';
import type { AuthStatus, AuthUser, LoginCredentials } from './types';

const TOKEN_KEY = 'auth_token';
const EXPIRES_AT_KEY = 'auth_expires_at';
/** How long startup waits for /me before treating it like any other non-401/403 failure. */
const RESTORE_TIMEOUT_MS = 8000;

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  permissions: string[];
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
  permissions: [],

  restore: async () => {
    const [token, expiresAt] = await Promise.all([
      secureStorage.get(TOKEN_KEY),
      secureStorage.get(EXPIRES_AT_KEY),
    ]);
    // The token is never renewed, so past its expiry the server would only answer 401.
    if (!token || (expiresAt && Date.parse(expiresAt) <= Date.now())) {
      await useAuthStore.getState().clearSession();
      return;
    }
    setAccessToken(token);
    // Aborting after the timeout ends the splash on a bad network. fetch's signal is the
    // only cancel hook, and AbortSignal.timeout is not guaranteed on Hermes.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RESTORE_TIMEOUT_MS);
    try {
      const { user, permissions } = await authApi.me(controller.signal);
      set({ status: 'authenticated', user, permissions });
    } catch (error) {
      // 401 already wiped the session via the unauthorized handler. 403 means the account was
      // deactivated, so the token is dead too. Any other failure (offline, 5xx, timeout)
      // keeps it, so the next launch can try again.
      if (toAppError(error).code === 'forbidden') {
        await useAuthStore.getState().clearSession();
        return;
      }
      setAccessToken(null);
      set({ status: 'unauthenticated', user: null, permissions: [] });
    } finally {
      clearTimeout(timeout);
    }
  },

  signIn: async (credentials) => {
    const { token, expires_at, user, permissions } = await authApi.login(
      credentials,
      await getDeviceName(),
    );
    await Promise.all([
      secureStorage.set(TOKEN_KEY, token),
      secureStorage.set(EXPIRES_AT_KEY, expires_at),
    ]);
    setAccessToken(token);
    set({ status: 'authenticated', user, permissions });
  },

  signOut: async () => {
    // Best effort: the local session must end even if the server cannot be reached.
    await authApi.logout().catch(() => {});
    await useAuthStore.getState().clearSession();
  },

  clearSession: async () => {
    setAccessToken(null);
    set({ status: 'unauthenticated', user: null, permissions: [] });
    await Promise.all([secureStorage.remove(TOKEN_KEY), secureStorage.remove(EXPIRES_AT_KEY)]);
  },
}));

setUnauthorizedHandler(() => void useAuthStore.getState().clearSession());

export const useAuthStatus = () => useAuthStore((state) => state.status);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const usePermissions = () => useAuthStore((state) => state.permissions);
