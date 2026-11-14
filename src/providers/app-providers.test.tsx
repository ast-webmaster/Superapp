import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useConfirm, useToast } from '@/shared/ui';

import { AppProviders } from './app-providers';

// expo-router does not load under jest here; only the providers inside the theme are under test.
jest.mock('expo-router', () => ({
  DefaultTheme: { colors: {} },
  ThemeProvider: ({ children }: { children: unknown }) => children,
}));
jest.mock('./query-client', () => {
  const { QueryClient } = jest.requireActual('@tanstack/react-query');
  return { queryClient: new QueryClient() };
});

function UsesFeedback() {
  useToast();
  useConfirm();
  return <Text>ready</Text>;
}

it('gives every screen toasts and confirm dialogs', async () => {
  await render(
    <AppProviders>
      <UsesFeedback />
    </AppProviders>,
  );

  expect(screen.getByText('ready')).toBeOnTheScreen();
});
