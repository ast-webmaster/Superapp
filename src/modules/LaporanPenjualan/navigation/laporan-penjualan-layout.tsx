import { Stack } from 'expo-router/stack';

import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

export function LaporanPenjualanLayout() {
  return (
    <Stack
      screenOptions={{
        header: renderTopAppBar,
        contentStyle: { backgroundColor: colors.ground },
      }}>
      <Stack.Screen name="index" options={{ title: 'Laporan Penjualan' }} />
      {/* The screen replaces this with the group's name. */}
      <Stack.Screen name="[group]" options={{ title: 'Group' }} />
    </Stack>
  );
}
