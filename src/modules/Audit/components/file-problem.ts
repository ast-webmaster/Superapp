import type { PickedFile } from '@/core/files';

/** The file types and size the server accepts for any Audit attachment. */
const EXTENSIONS = ['xlsx', 'xls', 'csv', 'doc', 'docx', 'pdf', 'jpg', 'png', 'jpeg', 'msg', 'zip'];
const MAX_BYTES = 30 * 1024 * 1024;

/** Why the device refuses the file before it is sent, or null when it looks fine. */
export function fileProblem(file: PickedFile): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!EXTENSIONS.includes(extension)) return `Choose a ${EXTENSIONS.join(', ')} file.`;
  if (file.size !== null && file.size > MAX_BYTES) return 'The file is larger than 30 MB.';
  return null;
}
