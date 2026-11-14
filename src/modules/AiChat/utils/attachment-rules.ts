import type { PickedFile } from '@/core/files';

// The server's limits (config('aichat.attachments')), checked on the device first so a bad file
// is never uploaded. The server checks again.

export const MAX_FILES = 3;
const MB = 1024 * 1024;
const MAX_FILE_BYTES = 10 * MB;
const MAX_IMAGE_BYTES = 5 * MB;
const ALLOWED = ['pdf', 'png', 'jpg', 'jpeg', 'docx', 'xlsx', 'xls'];
const IMAGES = ['png', 'jpg', 'jpeg'];

/** `null` when the file may be added, else the message to show. */
export function checkAttachment(file: PickedFile, current: PickedFile[]): string | null {
  if (current.length >= MAX_FILES) return 'You can attach up to 3 files.';
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED.includes(extension)) {
    return 'This file type is not supported. Use pdf, png, jpg, docx or xlsx.';
  }
  if (file.size === null) return null;
  if (IMAGES.includes(extension) && file.size > MAX_IMAGE_BYTES) return 'Images can be up to 5 MB.';
  if (file.size > MAX_FILE_BYTES) return 'Files can be up to 10 MB.';
  return null;
}
