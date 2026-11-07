import { Stack } from 'expo-router/stack';

import { colors } from '@/shared/theme/tokens';

// Every route in this group requires a signed-in user (guarded in RootNavigator).
// The tabs and each business module bring their own header; account uses the stack header.
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="account"
        options={{
          headerShown: true,
          title: 'Account',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: 'PlusJakartaSans', fontWeight: '700' },
          contentStyle: { backgroundColor: colors['surface-gray'] },
        }}
      />
    </Stack>
  );
}
