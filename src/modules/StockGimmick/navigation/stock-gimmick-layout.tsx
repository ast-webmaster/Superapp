import { Stack } from 'expo-router/stack';

import { morphScreenOptions } from '@/shared/motion/morph';
import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

export function StockGimmickLayout() {
  return (
    <Stack
      screenOptions={{
        ...morphScreenOptions,
        header: renderTopAppBar,
        contentStyle: { backgroundColor: colors.ground },
      }}>
      <Stack.Screen name="index" options={{ title: 'Stock Gimmick' }} />
      <Stack.Screen name="[id]" options={{ title: 'Stock' }} />
    </Stack>
  );
}
