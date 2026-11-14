import { requireOptionalNativeModule } from 'expo';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { AppError } from '../errors';

/** A file the user chose from the device, ready to show and to upload. */
export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string | null;
  size: number | null;
};

/** Opens the system file picker. Resolves with `null` when the user closes it without choosing. */
export async function pickFile(): Promise<PickedFile | null> {
  // A build made before expo-document-picker was added has no native module for it, and
  // importing the package then throws a red error. Look for the module first.
  if (Platform.OS !== 'web' && !requireOptionalNativeModule('ExpoDocumentPicker')) {
    throw new AppError('This build cannot pick files yet. Install the latest build.', 'unknown');
  }
  const DocumentPicker = await import('expo-document-picker');
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? null,
    size: asset.size ?? null,
  };
}

/**
 * The file's bytes as a `Blob` for a multipart body. Native uses expo's `File`, which carries its
 * name and type into the body; the web picker gives a `blob:` uri that `fetch` can read.
 */
export async function toUploadBlob(file: PickedFile): Promise<Blob> {
  if (Platform.OS === 'web') return (await fetch(file.uri)).blob();
  return new File(file.uri);
}
