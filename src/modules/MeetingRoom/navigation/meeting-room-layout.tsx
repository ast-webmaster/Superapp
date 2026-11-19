import { Stack } from 'expo-router/stack';

import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

export function MeetingRoomLayout() {
  return (
    <Stack
      screenOptions={{
        header: renderTopAppBar,
        contentStyle: { backgroundColor: colors.ground },
      }}>
      <Stack.Screen name="index" options={{ title: 'Meeting Room' }} />
      <Stack.Screen name="new" options={{ title: 'Book a room' }} />
      <Stack.Screen name="[id]" options={{ title: 'Booking' }} />
    </Stack>
  );
}
