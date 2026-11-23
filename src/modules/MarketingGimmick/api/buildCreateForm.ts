import { toUploadBlob } from '@/core/files';

import type { FlowConfig } from '../flows';
import type { GimmickDraft } from '../types';

/**
 * The body of `POST /marketing-<flow>`, always multipart because of the file. The number, status
 * and creator are the server's. The draft must already be valid (see `create/draft.ts`), so the
 * required fields below are never null.
 */
export async function buildCreateForm(flow: FlowConfig, draft: GimmickDraft): Promise<FormData> {
  const form = new FormData();
  if (flow.needsOffice) form.append('office', String(draft.office?.id ?? ''));
  form.append('remarks', draft.remarks.trim());
  if (draft.doc) form.append('doc', await toUploadBlob(draft.doc), draft.doc.name);

  for (const [index, row] of draft.items.entries()) {
    form.append(`items[${index}][code_item]`, row.item?.code_item ?? '');
    form.append(`items[${index}][qty]`, String(Number(row.qty)));
  }
  return form;
}
