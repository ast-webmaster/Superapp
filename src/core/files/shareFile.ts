import { requireOptionalNativeModule } from 'expo';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { AppError } from '../errors';

/**
 * Hands a file the app just built to the user: the browser downloads it, a phone opens the share
 * sheet (where "Save to Files" and the mail and chat apps live). Bytes only, so any endpoint that
 * returns a file can use it.
 */
export async function shareFile(bytes: Uint8Array, filename: string, mimeType: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  // A build made before expo-sharing was added has no native module for it, and importing the
  // package then throws and logs a red error. Look for the module first, import late, and
  // fall back to asking where to save the file.
  if (!requireOptionalNativeModule('ExpoSharing')) {
    await saveToChosenFolder(bytes, filename, mimeType);
    return;
  }
  const Sharing = await import('expo-sharing');
  if (!(await Sharing.isAvailableAsync())) {
    await saveToChosenFolder(bytes, filename, mimeType);
    return;
  }
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(bytes);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: filename });
}

/** Lets the user pick a folder (Downloads, Drive...) and writes the file there. */
async function saveToChosenFolder(bytes: Uint8Array, filename: string, mimeType: string) {
  let folder: Directory;
  try {
    folder = await Directory.pickDirectoryAsync();
  } catch {
    // Closing the picker is a choice, not a failure.
    return;
  }
  try {
    folder.createFile(filename, mimeType).write(bytes);
  } catch {
    throw new AppError('Could not save the file to that folder. Pick another folder.', 'unknown');
  }
}
