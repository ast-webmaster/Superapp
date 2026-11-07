import { QueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/core/auth';
import { isRetryable } from '@/core/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Retrying a 401/403/404/422 cannot help; only transient failures are retried.
      retry: (failureCount, error) => failureCount < 2 && isRetryable(error),
    },
  },
});

// Cached server data belongs to the signed-in user. Drop it when that session ends
// (sign-out or an expired token) so the next user never sees it.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    queryClient.clear();
  }
});
