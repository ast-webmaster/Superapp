import * as ImagePicker from 'expo-image-picker';

import { AppError } from '@/core/errors';

import type { ProofPhoto } from '../types';

/** The server refuses a proof photo above this. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * Opens the camera for the proof photo. There is no gallery option: the server flags a photo that
 * did not come from the camera. Resolves with `null` when the user closes the camera.
 */
export async function takeProofPhoto(): Promise<ProofPhoto | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new AppError('Allow camera access in your phone settings, then try again.', 'forbidden');
  }

  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;

  if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) {
    throw new AppError('That photo is larger than 5 MB. Take it again.', 'validation');
  }
  const name = asset.fileName ?? asset.uri.split('/').pop() ?? 'photo.jpg';
  return {
    uri: asset.uri,
    name: /\.(jpe?g|png|webp)$/i.test(name) ? name : `${name}.jpg`,
    mimeType: asset.mimeType ?? 'image/jpeg',
    size: asset.fileSize ?? null,
  };
}
