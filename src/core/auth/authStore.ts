import { create } from 'zustand';

import { setAccessToken, setForbiddenHandler, setUnauthorizedHandler } from '@/core/api';
import { toAppError } from '@/core/errors';
import { secureStorage } from '@/core/storage';

import { authApi } from './authApi';
import { getDeviceName } from './deviceName';
import type {
  AuthStatus,
  AuthUser,
  ChangePasswordInput,
  LoginCredentials,
  UpdateProfileInput,
} from './types';

const TOKEN_KEY = 'auth_token';
const EXPIRES_AT_KEY = 'auth_expires_at';
/** How long startup waits for /me before treating it like any other non-401/403 failure. */
const RESTORE_TIMEOUT_MS = 8000;
/**
 * Minimum gap between two session reloads that were not forced. Reloads happen on app
 * focus, so this keeps a user switching apps back and forth from calling /me each time.
 */
export const SESSION_REFRESH_INTERVAL_MS = 60_000;

/** When the session was last loaded from the server (sign-in, startup or refresh). */
let sessionLoadedAt = 0;
/** The reload in flight, so concurrent callers share one /me request. */
let refreshing: Promise<void> | null = null;

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  roles: string[];
  permissions: string[];
  /** Load the stored token and validate it. Call once at startup. */
  restore: () => Promise<void>;
  /**
   * Reload user, roles and permissions from /me, so changes made on the web reach the app.
   * Skipped within `SESSION_REFRESH_INTERVAL_MS` of the last load unless `force` is set.
   * Ends the session when the server rejects the token or the account is inactive.
   */
  refreshSession: (options?: { force?: boolean }) => Promise<void>;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  /** Change the name and/or photo. The session user becomes the server's copy. */
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
  /** Drop the session locally (no server call). Used when the server rejects the token. */
  clearSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'restoring',
  user: null,
  roles: [],
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
      const { user, roles, permissions } = await authApi.me(controller.signal);
      sessionLoadedAt = Date.now();
      set({ status: 'authenticated', user, roles, permissions });
    } catch (error) {
      // 401 already wiped the session via the unauthorized handler. 403 means the account was
      // deactivated, so the token is dead too. Any other failure (offline, 5xx, timeout)
      // keeps it, so the next launch can try again.
      if (toAppError(error).code === 'forbidden') {
        await useAuthStore.getState().clearSession();
        return;
      }
      setAccessToken(null);
      set({ status: 'unauthenticated', user: null, roles: [], permissions: [] });
    } finally {
      clearTimeout(timeout);
    }
  },

  refreshSession: ({ force = false } = {}) => {
    if (get().status !== 'authenticated') return Promise.resolve();
    if (refreshing) return refreshing;
    if (!force && Date.now() - sessionLoadedAt < SESSION_REFRESH_INTERVAL_MS) {
      return Promise.resolve();
    }

    const userId = get().user?.id;
    refreshing = (async () => {
      try {
        const { user, roles, permissions } = await authApi.me();
        sessionLoadedAt = Date.now();
        // The user may have signed out, or another one in, while /me was on its way.
        if (get().status === 'authenticated' && get().user?.id === userId) {
          set({ user, roles, permissions });
        }
      } catch (error) {
        // 401 already cleared the session via the unauthorized handler. 403 on /me means the
        // account is inactive. Anything else (offline, timeout, 5xx) keeps the session as it
        // is and the next focus tries again.
        if (toAppError(error).code === 'forbidden') await get().clearSession();
      } finally {
        refreshing = null;
      }
    })();
    return refreshing;
  },

  signIn: async (credentials) => {
    const { token, expires_at, user, roles, permissions } = await authApi.login(
      credentials,
      await getDeviceName(),
    );
    await Promise.all([
      secureStorage.set(TOKEN_KEY, token),
      secureStorage.set(EXPIRES_AT_KEY, expires_at),
    ]);
    setAccessToken(token);
    sessionLoadedAt = Date.now();
    set({ status: 'authenticated', user, roles, permissions });
  },

  signOut: async () => {
    // Best effort: the local session must end even if the server cannot be reached.
    await authApi.logout().catch(() => {});
    await useAuthStore.getState().clearSession();
  },

  updateProfile: async (input) => {
    set({ user: await authApi.updateProfile(input) });
  },

  changePassword: async (input) => {
    await authApi.changePassword(input);
  },

  clearSession: async () => {
    setAccessToken(null);
    set({ status: 'unauthenticated', user: null, roles: [], permissions: [] });
    await Promise.all([secureStorage.remove(TOKEN_KEY), secureStorage.remove(EXPIRES_AT_KEY)]);
  },
}));

setUnauthorizedHandler(() => void useAuthStore.getState().clearSession());
// A 403 means the server no longer allows something the app offered, usually because a
// permission was taken away on the web. Reload the permissions so the app stops offering it.
setForbiddenHandler(() => void useAuthStore.getState().refreshSession({ force: true }));

export const useAuthStatus = () => useAuthStore((state) => state.status);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useRoles = () => useAuthStore((state) => state.roles);
export const usePermissions = () => useAuthStore((state) => state.permissions);
