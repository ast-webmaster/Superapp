import { Stack } from 'expo-router/stack';

import { colors } from '@/shared/theme/tokens';

export function PriceApprovalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: 'PlusJakartaSans', fontWeight: '700' },
        contentStyle: { backgroundColor: colors['surface-gray'] },
      }}>
      <Stack.Screen name="index" options={{ title: 'Price approval' }} />
    </Stack>
  );
}
