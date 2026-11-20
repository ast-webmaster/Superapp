import { Stack } from 'expo-router/stack';

import { morphScreenOptions } from '@/shared/motion/morph';
import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

export function MarketingPromoLayout() {
  return (
    <Stack
      screenOptions={{
        ...morphScreenOptions,
        header: renderTopAppBar,
        contentStyle: { backgroundColor: colors.ground },
      }}>
      <Stack.Screen name="index" options={{ title: 'Marketing Promo' }} />
      <Stack.Screen name="[id]" options={{ title: 'Promo' }} />
    </Stack>
  );
}
