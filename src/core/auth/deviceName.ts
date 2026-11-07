import { Platform } from 'react-native';

import { secureStorage } from '@/core/storage';

const INSTALL_ID_KEY = 'install_id';

/**
 * Stable per-install name sent as `device_name`. The backend keeps one token per name, so a
 * stable name makes a new sign-in replace this device's token and leave other devices alone.
 */
export async function getDeviceName() {
  let id = await secureStorage.get(INSTALL_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    await secureStorage.set(INSTALL_ID_KEY, id);
  }
  return `${Platform.OS}-${id}`;
}
