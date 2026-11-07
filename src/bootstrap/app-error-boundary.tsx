import type { ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Alert, Button } from '@/shared/ui';

/** Shown when a screen crashes. The cause goes to the logs, not to the person using the app. */
export function AppErrorBoundary({ retry }: ErrorBoundaryProps) {
  useEffect(() => {
    // A crash during startup would otherwise leave the splash screen up forever.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View className="flex-1 justify-center gap-4 bg-surface p-5">
      <Alert tone="danger" message="Something went wrong. Please try again." />
      <Button block onPress={() => void retry()}>
        Try again
      </Button>
    </View>
  );
}
