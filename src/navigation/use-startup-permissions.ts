import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Asks for notification permission when the app opens, so the user can allow it up front.
 * Camera, location and photos are not asked here: Apple and Google want those requested in
 * context, from the screen that uses them. Denied permission is not asked again (the user
 * changes it in system settings). Never throws.
 */
export async function requestStartupPermissions(): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
  try {
    // Android 13+ only shows the notification prompt once a channel exists.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: AndroidImportance.HIGH,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (!current.granted && current.canAskAgain) await Notifications.requestPermissionsAsync();
  } catch {
    // Permission prompts are best effort and must never block startup.
  }
}

export function useStartupPermissions(): void {
  useEffect(() => {
    void requestStartupPermissions();
  }, []);
}
