import { Stack } from 'expo-router/stack';

import { morphScreenOptions } from '@/shared/motion/morph';
import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

export function SalesVisitationLayout() {
  return (
    <Stack
      screenOptions={{
        ...morphScreenOptions,
        header: renderTopAppBar,
        contentStyle: { backgroundColor: colors.ground },
      }}>
      <Stack.Screen name="index" options={{ title: 'Sales Visitation' }} />
      <Stack.Screen name="[uuid]" options={{ title: 'Visit' }} />
      <Stack.Screen name="new" options={{ title: 'Plan a visit' }} />
      <Stack.Screen name="edit/[uuid]" options={{ title: 'Edit visit' }} />
      <Stack.Screen name="check-in/[uuid]" options={{ title: 'Check in' }} />
      <Stack.Screen name="check-out/[uuid]" options={{ title: 'Check out' }} />
    </Stack>
  );
}
