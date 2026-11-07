import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { queryClient } from './query-client';

export function AppProviders({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}
