import { Stack } from 'expo-router/stack';

import { useCan } from '@/core/permissions';
import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

import { moduleManifests } from './registry';

// Every route in this group requires a signed-in user (guarded in RootNavigator).
// The tabs and each business module bring their own header; profile, its sub-screens and
// manage-apps use the shared top app bar.
const stackHeader = {
  headerShown: true,
  header: renderTopAppBar,
  contentStyle: { backgroundColor: colors.ground },
} as const;

/** The stack behind sign-in: tabs, account screens and one screen per business module. */
export function AppStack() {
  const can = useCan();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile" options={{ ...stackHeader, title: 'Profile' }} />
      <Stack.Screen name="edit-profile" options={{ ...stackHeader, title: 'Edit profile' }} />
      <Stack.Screen name="change-password" options={{ ...stackHeader, title: 'Change password' }} />
      <Stack.Screen name="manage-apps" options={{ ...stackHeader, title: 'Manage apps' }} />
      {/* A module the user lost access to closes, and links into it (push, inbox) go home,
          as soon as the permissions reload. The server already refuses its requests. */}
      {moduleManifests.map((manifest) => (
        <Stack.Protected key={manifest.id} guard={can(manifest.permission)}>
          <Stack.Screen name={manifest.route.replace(/^\//, '')} />
        </Stack.Protected>
      ))}
    </Stack>
  );
}
