import '../global.css';

import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/bootstrap/animated-icon';
import { RootNavigator } from '@/navigation/root-navigator';
import { AppProviders } from '@/providers/app-providers';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AppProviders>
      <AnimatedSplashOverlay />
      <RootNavigator />
    </AppProviders>
  );
}
