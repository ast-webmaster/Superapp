import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { pushApi } from './pushApi';

/** Asks for permission and registers this device's Expo push token. Never throws. */
export async function registerForPushNotifications(): Promise<void> {
  try {
    const platform = Platform.OS;
    if ((platform !== 'android' && platform !== 'ios') || !Device.isDevice) return;

    if (platform === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: AndroidImportance.HIGH,
      });
    }

    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) {
      permission = await Notifications.requestPermissionsAsync();
    }
    if (!permission.granted) return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    await pushApi.register(data, platform);
  } catch {
    // Push is best effort; a failure must never break sign-in.
  }
}
