import { Stack } from 'expo-router/stack';

import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

export function PurchaseRequestLayout() {
  return (
    <Stack
      screenOptions={{
        header: renderTopAppBar,
        contentStyle: { backgroundColor: colors.ground },
      }}>
      <Stack.Screen name="index" options={{ title: 'Purchase Request' }} />
      <Stack.Screen name="[id]" options={{ title: 'Request' }} />
      <Stack.Screen name="new" options={{ title: 'New request' }} />
    </Stack>
  );
}
