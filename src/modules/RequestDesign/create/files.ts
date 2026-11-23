import type { PickedFile } from '@/core/files';

export type FileRule = {
  extensions: readonly string[];
  maxBytes: number;
  /** What the field says under itself, e.g. "JPG, PNG, PDF, DOC, DOCX, MP4, XLS or XLSX, up to 15 MB." */
  hint: string;
  /** What a refused type says. */
  typeProblem: string;
  sizeProblem: string;
};

/** A reference file of an item. The server's limit is 15,240 KB. */
export const REFERENCE_RULE: FileRule = {
  extensions: ['jpg', 'png', 'pdf', 'doc', 'docx', 'mp4', 'xls', 'xlsx'],
  maxBytes: 15_240 * 1024,
  hint: 'JPG, PNG, PDF, DOC, DOCX, MP4, XLS or XLSX, up to 15 MB.',
  typeProblem: 'Choose a JPG, PNG, PDF, DOC, DOCX, MP4, XLS or XLSX file.',
  sizeProblem: 'That file is larger than 15 MB. Choose a smaller one.',
};

/** The designer's finished work. The server's limit is 20 MB. */
export const RESULT_RULE: FileRule = {
  extensions: [
    'jpg',
    'jpeg',
    'png',
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'mp4',
    'zip',
    'rar',
  ],
  maxBytes: 20 * 1024 * 1024,
  hint: 'JPG, PNG, PDF, Office files, MP4, ZIP or RAR, up to 20 MB.',
  typeProblem: 'Choose a JPG, PNG, PDF, Office, MP4, ZIP or RAR file.',
  sizeProblem: 'That file is larger than 20 MB. Choose a smaller one.',
};

/** Why the server would refuse this file, checked on the device first. Undefined when it is fine. */
export function fileProblem(file: PickedFile, rule: FileRule): string | undefined {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!rule.extensions.includes(extension)) return rule.typeProblem;
  if (file.size !== null && file.size > rule.maxBytes) return rule.sizeProblem;
  return undefined;
}

export const MAX_LINK = 2000;

/** A complete http or https address, which is what the server accepts as a URL. */
export function linkProblem(link: string): string | undefined {
  const value = link.trim();
  if (!value) return 'Paste the link to the result.';
  if (value.length > MAX_LINK) return `Use at most ${MAX_LINK} characters.`;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
      return 'Enter a full link, starting with https://.';
  } catch {
    return 'Enter a full link, starting with https://.';
  }
  return undefined;
}
