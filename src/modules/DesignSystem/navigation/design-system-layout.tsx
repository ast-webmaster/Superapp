import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';

import { ToastProvider } from '@/shared/ui';

export function DesignSystemLayout() {
  return (
    <ToastProvider>
      {/* The design system is light only, so the status bar stays dark in dark mode too. */}
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </ToastProvider>
  );
}
