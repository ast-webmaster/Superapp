const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  msg: 'application/vnd.ms-outlook',
};

/** The MIME type a downloaded file is shared with, taken from its extension. */
export function mimeTypeOf(filename: string): string {
  return MIME[filename.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream';
}
