import '../global.css';

import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/bootstrap/splash-overlay';
import { useAppFonts } from '@/bootstrap/use-app-fonts';
import { RootNavigator } from '@/navigation/root-navigator';
import { AppProviders } from '@/providers/app-providers';

export { AppErrorBoundary as ErrorBoundary } from '@/bootstrap/app-error-boundary';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsReady = useAppFonts();

  // The native splash stays up until AnimatedSplashOverlay lays out.
  if (!fontsReady) return null;

  return (
    <AppProviders>
      <AnimatedSplashOverlay />
      <RootNavigator />
    </AppProviders>
  );
}
