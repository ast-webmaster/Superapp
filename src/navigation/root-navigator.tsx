import { Stack } from 'expo-router/stack';
import { useEffect } from 'react';

import { useAuthStatus, useAuthStore } from '@/core/auth';

import { usePushNotifications } from './use-push-notifications';
import { useSessionRefresh } from './use-session-refresh';
import { useStartupPermissions } from './use-startup-permissions';

export function RootNavigator() {
  const status = useAuthStatus();
  const restore = useAuthStore((state) => state.restore);

  useEffect(() => {
    void restore();
  }, [restore]);

  usePushNotifications();
  useSessionRefresh();
  useStartupPermissions();

  // Do not pick a screen from a session we have not loaded yet: that would flash the
  // login screen at a signed-in user and misroute deep links. The splash overlay covers
  // the screen meanwhile, so nothing is drawn here.
  if (status === 'restoring') return null;

  const signedIn = status === 'authenticated';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Everything behind sign-in lives under the (app) route group, so adding a
          module never requires touching this file. */}
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      {/* The design system reference, for development builds only. */}
      <Stack.Protected guard={__DEV__}>
        <Stack.Screen name="design-system" />
      </Stack.Protected>
    </Stack>
  );
}
