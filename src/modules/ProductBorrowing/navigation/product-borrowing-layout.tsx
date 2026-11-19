import { Stack } from 'expo-router/stack';

import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

export function ProductBorrowingLayout() {
  return (
    <Stack
      screenOptions={{
        header: renderTopAppBar,
        contentStyle: { backgroundColor: colors.ground },
      }}>
      <Stack.Screen name="index" options={{ title: 'Product Borrowing' }} />
      <Stack.Screen name="[id]" options={{ title: 'Borrowing' }} />
      <Stack.Screen name="new" options={{ title: 'New borrowing' }} />
      <Stack.Screen name="resubmit/[id]" options={{ title: 'Revise borrowing' }} />
    </Stack>
  );
}
