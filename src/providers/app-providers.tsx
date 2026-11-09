import { QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, ThemeProvider } from 'expo-router';
import type { ReactNode } from 'react';

import { colors } from '@/shared/theme/tokens';
import { ConfirmProvider } from '@/shared/ui';

import { queryClient } from './query-client';

// The Astrindo tokens are light only, so the navigation chrome is too.
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.ground,
    card: colors.ground,
    text: colors.ink,
    border: colors.border,
    notification: colors.danger,
  },
};

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navigationTheme}>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
