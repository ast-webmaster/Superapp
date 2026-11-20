import { Stack } from 'expo-router/stack';

import { morphScreenOptions } from '@/shared/motion/morph';
import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

export function OnDutyRequestLayout() {
  return (
    <Stack
      screenOptions={{
        ...morphScreenOptions,
        header: renderTopAppBar,
        contentStyle: { backgroundColor: colors.ground },
      }}>
      <Stack.Screen name="index" options={{ title: 'On Duty Request' }} />
      <Stack.Screen name="[id]" options={{ title: 'On duty' }} />
      <Stack.Screen name="new" options={{ title: 'New request' }} />
      <Stack.Screen name="resubmit/[id]" options={{ title: 'Revise request' }} />
      <Stack.Screen name="declaration/[id]" options={{ title: 'Declaration' }} />
    </Stack>
  );
}
