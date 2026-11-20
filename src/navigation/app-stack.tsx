import { Stack } from 'expo-router/stack';

import { useCan } from '@/core/permissions';
import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';
import { colors } from '@/shared/theme/tokens';
import { renderTopAppBar } from '@/shared/ui';

import { moduleManifests } from './registry';
import { UpdateBanner } from './update-banner';

// Every route in this group requires a signed-in user (guarded in RootNavigator).
// The tabs and each business module bring their own header; profile, its sub-screens and
// manage-apps use the shared top app bar.
const stackHeader = {
  headerShown: true,
  header: renderTopAppBar,
} as const;

/** The stack behind sign-in: tabs, account screens and one screen per business module. */
export function AppStack() {
  return (
    <>
      <AppStackScreens />
      <UpdateBanner />
    </>
  );
}

function AppStackScreens() {
  const can = useCan();
  const reducedMotion = useReducedMotion();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // The ground behind every screen, so a module never flashes white mid-transition.
        contentStyle: { backgroundColor: colors.ground },
        // Pushes keep the platform's own transition, and its interactive swipe back. With
        // reduce motion on, they fade instead of sliding.
        animation: reducedMotion ? 'fade' : undefined,
      }}>
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
