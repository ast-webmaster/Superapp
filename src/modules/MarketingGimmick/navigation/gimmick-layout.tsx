import { Stack } from 'expo-router/stack';

import { morphScreenOptions } from '@/shared/motion/morph';
import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

import { flows } from '../flows';
import type { GimmickFlow } from '../types';

export function GimmickLayout({ flow: flowKey }: { flow: GimmickFlow }) {
  const flow = flows[flowKey];

  return (
    <Stack
      screenOptions={{
        ...morphScreenOptions,
        header: renderTopAppBar,
        contentStyle: { backgroundColor: colors.ground },
      }}>
      <Stack.Screen name="index" options={{ title: flow.title }} />
      <Stack.Screen name="[uuid]" options={{ title: 'Document' }} />
      <Stack.Screen name="new" options={{ title: flow.createLabel }} />
    </Stack>
  );
}
