import { Stack } from 'expo-router/stack';

// Every route in this group requires a signed-in user (guarded in RootNavigator).
// Each child — the tabs and every business module — brings its own header.
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
