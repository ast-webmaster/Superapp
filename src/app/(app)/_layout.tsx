import { Stack } from 'expo-router/stack';

import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

// Every route in this group requires a signed-in user (guarded in RootNavigator).
// The tabs and each business module bring their own header; profile, its sub-screens and
// manage-apps use the shared top app bar.
const stackHeader = {
  headerShown: true,
  header: renderTopAppBar,
  contentStyle: { backgroundColor: colors.ground },
} as const;

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile" options={{ ...stackHeader, title: 'Profile' }} />
      <Stack.Screen name="edit-profile" options={{ ...stackHeader, title: 'Edit profile' }} />
      <Stack.Screen name="change-password" options={{ ...stackHeader, title: 'Change password' }} />
      <Stack.Screen name="manage-apps" options={{ ...stackHeader, title: 'Manage apps' }} />
    </Stack>
  );
}
