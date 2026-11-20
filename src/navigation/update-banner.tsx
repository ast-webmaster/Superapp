import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';
import { sizes } from '@/shared/theme/tokens';
import { AppText, Button, Icon } from '@/shared/ui';

import { useAppUpdate } from './use-app-update';

/**
 * Tells the user a new version has been downloaded and lets them restart into it. It never
 * blocks: the user can keep working and choose "Later". It sits where toasts do, over the
 * screen and under the status bar, and is drawn only while an update waits.
 */
export function UpdateBanner() {
  const { ready, restarting, dismiss, restart } = useAppUpdate();
  const reducedMotion = useReducedMotion();
  const { top } = useSafeAreaInsets();

  if (!ready) return null;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {/* `Animated.View` takes `style` only, so the card and its classes are a plain View inside. */}
      <Animated.View
        entering={reducedMotion ? FadeIn.duration(150) : FadeInUp.duration(300)}
        pointerEvents="box-none"
        style={{ position: 'absolute', left: 20, right: 20, top: top + sizes.toastOffset }}>
        <View className="mx-auto w-full max-w-phone gap-3 rounded-lg border border-border bg-surface p-4">
          <View className="flex-row items-center gap-3">
            <View className="size-touch items-center justify-center rounded-md bg-primary-soft">
              <Icon name="refresh" color="primary" />
            </View>
            <View className="min-w-0 flex-1" role="status" aria-live="polite" accessible>
              <AppText variant="info-title">Update ready</AppText>
              <AppText variant="caption" tone="muted">
                Restart to use the latest version.
              </AppText>
            </View>
          </View>
          <View className="flex-row justify-end gap-2">
            <Button variant="soft" size="sm" onPress={dismiss} disabled={restarting}>
              Later
            </Button>
            <Button size="sm" onPress={restart} loading={restarting}>
              Restart
            </Button>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
