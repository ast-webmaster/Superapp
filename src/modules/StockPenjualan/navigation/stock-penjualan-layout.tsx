import { Stack } from 'expo-router/stack';

import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

export function StockPenjualanLayout() {
  return (
    <Stack
      screenOptions={{
        header: renderTopAppBar,
        contentStyle: { backgroundColor: colors.ground },
      }}>
      <Stack.Screen name="index" options={{ title: 'Stock Penjualan' }} />
    </Stack>
  );
}
