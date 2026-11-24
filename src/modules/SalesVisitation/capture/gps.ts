import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import { AppError } from '@/core/errors';

import type { GpsFix } from '../types';

/**
 * One fresh reading of where the device is, with the proof the server weighs it by. The server
 * judges the distance, the age and the flags; the app only reports what the device said.
 *
 * Throws an `AppError` with a message the user can act on when the permission is refused, GPS is
 * off or the build has no location module.
 */
export async function readPosition(): Promise<GpsFix> {
  // A build made before expo-location was added has no native module for it, and importing the
  // package then throws a red error. Look for the module first.
  if (Platform.OS !== 'web' && !requireOptionalNativeModule('ExpoLocation')) {
    throw new AppError(
      'This build cannot read your location yet. Install the latest build.',
      'unknown',
    );
  }
  const Location = await import('expo-location');

  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new AppError(
      'Allow location access in your phone settings, then try again.',
      'forbidden',
    );
  }

  let position;
  try {
    position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  } catch {
    throw new AppError('Could not find your location. Turn on GPS and try again.', 'unknown');
  }

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    positionTimestamp: position.timestamp,
    // Taken as late as possible: the age of the reading is judged against this device clock.
    clientNow: Date.now(),
    isMock: position.mocked === true,
  };
}

/**
 * The reading to send with a check-in or check-out. When the panel does not require GPS, a device
 * that cannot locate itself still checks in (the server then skips the distance), so the failure
 * is dropped and the proof is left out. When GPS is required the failure reaches the user.
 */
export async function acquireFix(required: boolean): Promise<GpsFix | null> {
  try {
    return await readPosition();
  } catch (error) {
    if (required) throw error;
    return null;
  }
}
