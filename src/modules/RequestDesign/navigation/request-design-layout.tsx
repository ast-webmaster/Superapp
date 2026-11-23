import { Stack } from 'expo-router/stack';

import { morphScreenOptions } from '@/shared/motion/morph';
import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

export function RequestDesignLayout() {
  return (
    <Stack
      screenOptions={{
        ...morphScreenOptions,
        header: renderTopAppBar,
        contentStyle: { backgroundColor: colors.ground },
      }}>
      <Stack.Screen name="index" options={{ title: 'Request Design' }} />
      <Stack.Screen name="[uuid]" options={{ title: 'Request' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Stack.Screen name="new" options={{ title: 'New request' }} />
      <Stack.Screen name="edit/[uuid]" options={{ title: 'Edit request' }} />
    </Stack>
  );
}
