import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { AppState, Platform } from 'react-native';

import { useAuthStore } from '@/core/auth';
import { isRetryable } from '@/core/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Retrying a 401/403/404/409/422 cannot help; only transient failures are retried.
      retry: (failureCount, error) => failureCount < 2 && isRetryable(error),
    },
    mutations: {
      // A write is never repeated on its own: a retried approval could act twice.
      retry: false,
      // The default ('online') pauses a mutation while offline and sends it when the network
      // returns, which would submit an approval the user may no longer mean. Fail at once instead.
      networkMode: 'always',
    },
  },
});

// React Query listens to the browser's focus and online events. Native has neither, so
// without this, data never refreshes when the app returns from the background and queries
// never pause offline. The web keeps the library's own listeners.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener('change', (state) =>
      setFocused(state === 'active'),
    );
    return () => subscription.remove();
  });

  onlineManager.setEventListener((setOnline) => {
    void Network.getNetworkStateAsync().then((state) => setOnline(state.isConnected !== false));
    const subscription = Network.addNetworkStateListener((state) =>
      setOnline(state.isConnected !== false),
    );
    return () => subscription.remove();
  });
}

// Cached server data belongs to the signed-in user. Drop it when that session ends
// (sign-out or an expired token) so the next user never sees it.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    queryClient.clear();
  }
});
