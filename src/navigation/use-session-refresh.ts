import { focusManager } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuthStore } from '@/core/auth';

/**
 * Reloads the session (user, roles, permissions) whenever the app comes back to the
 * foreground, so an account deactivated or a permission changed on the web reaches the app.
 * It follows React Query's focus signal, which is AppState on native and page visibility on
 * the web, the same moment the screens refetch their data. `refreshSession` limits it to one
 * /me request a minute.
 */
export function useSessionRefresh() {
  const refreshSession = useAuthStore((state) => state.refreshSession);

  useEffect(
    () =>
      focusManager.subscribe((focused) => {
        if (focused) void refreshSession();
      }),
    [refreshSession],
  );
}
