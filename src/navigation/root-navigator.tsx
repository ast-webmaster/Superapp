import { Stack } from 'expo-router/stack';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { useAuthStatus, useAuthStore } from '@/core/auth';
import { Loading } from '@/shared/components/loading';
import { ThemedView } from '@/shared/components/themed-view';

export function RootNavigator() {
  const status = useAuthStatus();
  const restore = useAuthStore((state) => state.restore);

  useEffect(() => {
    void restore();
  }, [restore]);

  // Do not pick a screen from a session we have not loaded yet: that would flash the
  // login screen at a signed-in user and misroute deep links.
  if (status === 'restoring') {
    return (
      <ThemedView style={styles.fill}>
        <Loading />
      </ThemedView>
    );
  }

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

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
