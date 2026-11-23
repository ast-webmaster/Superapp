import { toUploadBlob } from '@/core/files';

import type { RequestDesignDraft } from '../types';

const REFERENCE_FIELDS = ['reference', 'reference_second', 'reference_third'] as const;

/**
 * The body of `POST /request-design` and, with `updatedAt`, of the edit (`POST` with
 * `_method=PUT`, because PHP does not read multipart on PUT). Always multipart because of the
 * reference files. The draft must already be valid (see `create/draft.ts`).
 *
 * An item sends only what its type uses, so a field left over from a type the user switched away
 * from never reaches the server. An item with `id` keeps the files it already has; a chosen file
 * replaces the one in its slot.
 */
export async function buildForm(draft: RequestDesignDraft, updatedAt?: string): Promise<FormData> {
  const form = new FormData();
  if (updatedAt) {
    form.append('_method', 'PUT');
    form.append('updated_at', updatedAt);
  }
  form.append('due_date', draft.dueDate ?? '');
  for (const code of draft.brands) form.append('category_codes[]', code);
  form.append('description', draft.description.trim());
  form.append('theme_concept', draft.themeConcept.trim());

  for (const [index, item] of draft.items.entries()) {
    const field = (name: string, value: string | number) =>
      form.append(`items[${index}][${name}]`, String(value));

    if (item.serverId !== null) field('id', item.serverId);
    field('type', item.type ?? '');
    field('qty', Number(item.qty));
    if (item.type === 'IMAGE') {
      field('purpose', item.purpose ?? '');
      if (item.purpose === 'DIGITAL') field('media', item.media ?? '');
      if (item.purpose === 'FISIK') {
        field('width', Number(item.width));
        field('length', Number(item.length));
      }
    }
    if (item.type === 'VIDEO') field('durasi', item.durasi.trim());
    if (item.remarks.trim()) field('remarks', item.remarks.trim());

    for (const [slot, file] of item.files.entries()) {
      if (file) {
        form.append(
          `items[${index}][${REFERENCE_FIELDS[slot]}]`,
          await toUploadBlob(file),
          file.name,
        );
      }
    }
  }
  return form;
}
