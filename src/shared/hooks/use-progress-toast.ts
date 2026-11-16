import { useCallback } from 'react';

import { useToast } from '@/shared/ui';

/**
 * Returns `withProgress(message, work)`: it runs `work` under a toast with a moving bar and ends
 * the toast when `work` settles, whether it resolved or threw. For a download or an export whose
 * length the server does not tell. Run only the fetch under it, not what waits for the user
 * afterwards (the share sheet), or the bar outlives the wait it stands for.
 */
export function useProgressToast() {
  const toast = useToast();

  return useCallback(
    async <T>(message: string, work: () => Promise<T>): Promise<T> => {
      const done = toast.progress(message);
      try {
        return await work();
      } finally {
        done();
      }
    },
    [toast],
  );
}
