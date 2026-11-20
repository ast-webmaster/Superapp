import { Stack } from 'expo-router/stack';

import { morphScreenOptions } from '@/shared/motion/morph';
import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

export function MarketingActivityLayout() {
  return (
    <Stack
      screenOptions={{
        ...morphScreenOptions,
        header: renderTopAppBar,
        contentStyle: { backgroundColor: colors.ground },
      }}>
      <Stack.Screen name="index" options={{ title: 'Marketing Activity' }} />
      <Stack.Screen name="[id]" options={{ title: 'Activity' }} />
    </Stack>
  );
}
