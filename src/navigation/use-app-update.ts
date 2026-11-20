import { focusManager } from '@tanstack/react-query';
import * as Updates from 'expo-updates';
import { useEffect, useRef, useState } from 'react';

/** The app already checks when it opens; coming back to it checks again at most this often. */
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

export interface AppUpdate {
  /** A newer version is downloaded and waits for a restart. */
  ready: boolean;
  restarting: boolean;
  /** Hides the banner for this version. A newer one shows it again. */
  dismiss: () => void;
  restart: () => Promise<void>;
}

/**
 * Over-the-air updates (EAS Update). By default `expo-updates` checks at launch and downloads in
 * the background, and the new version only runs after the next cold start, which an app that
 * stays in memory for days rarely gets. This also checks when the app returns to the foreground,
 * and lets the user restart into the new version instead of waiting. Updates are off in Expo Go
 * and development builds, where this does nothing. Checks are best effort and never throw.
 */
export function useAppUpdate(): AppUpdate {
  const { isUpdatePending, downloadedUpdate } = Updates.useUpdates();
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [restarting, setRestarting] = useState(false);
  const lastCheck = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    if (!Updates.isEnabled) return;

    return focusManager.subscribe((focused) => {
      const now = Date.now();
      if (!focused || busy.current || now - lastCheck.current < CHECK_INTERVAL_MS) return;

      busy.current = true;
      lastCheck.current = now;
      void (async () => {
        try {
          const check = await Updates.checkForUpdateAsync();
          if (check.isAvailable) await Updates.fetchUpdateAsync();
        } catch {
          // A failed check is retried the next time the app comes back.
        } finally {
          busy.current = false;
        }
      })();
    });
  }, []);

  const id = downloadedUpdate?.updateId ?? null;

  return {
    ready: isUpdatePending && (id === null || id !== dismissedId),
    restarting,
    dismiss: () => setDismissedId(id),
    restart: async () => {
      setRestarting(true);
      try {
        await Updates.reloadAsync();
      } catch {
        setRestarting(false);
      }
    },
  };
}
