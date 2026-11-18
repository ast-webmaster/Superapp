import { Stack } from 'expo-router/stack';

import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

export function RegisterCustomerLayout() {
  return (
    <Stack
      screenOptions={{
        header: renderTopAppBar,
        contentStyle: { backgroundColor: colors.ground },
      }}>
      <Stack.Screen name="index" options={{ title: 'Register Customer' }} />
      <Stack.Screen name="[id]" options={{ title: 'Registration' }} />
      <Stack.Screen name="new" options={{ title: 'New registration' }} />
    </Stack>
  );
}
