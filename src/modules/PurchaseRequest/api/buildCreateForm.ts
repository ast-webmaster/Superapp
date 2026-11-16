import { toUploadBlob } from '@/core/files';

import { parseAmount } from '../create/amount';
import type { PurchaseRequestDraft } from '../types';

/**
 * The body of `POST /purchase-request`, always multipart so one path covers requests with and
 * without files. Totals are not sent: the server calculates them. The draft must already be
 * valid (see `create/draft.ts`), so the required fields below are never null.
 */
export async function buildCreateForm(draft: PurchaseRequestDraft): Promise<FormData> {
  const form = new FormData();
  form.append('purpose', draft.purpose.trim());
  form.append('category', draft.category ?? '');
  form.append('office_id', String(draft.office?.id ?? ''));
  form.append('payment_method', draft.paymentMethod ?? '');
  if (draft.reference.trim()) form.append('reference', draft.reference.trim());
  if (draft.vendor) form.append('vendor_id', String(draft.vendor.id));
  if (draft.vendorReference.trim()) form.append('vendor_reference', draft.vendorReference.trim());

  for (const [index, item] of draft.items.entries()) {
    const key = `items[${index}]`;
    // A registered item goes by its code; a new one by name. The server refuses both together.
    if (item.source === 'registered') form.append(`${key}[item_code]`, item.item?.item_code ?? '');
    else form.append(`${key}[item_name]`, item.newName.trim());
    form.append(`${key}[qty]`, String(parseAmount(item.qty)));
    form.append(`${key}[unit_price]`, String(parseAmount(item.unitPrice)));
    form.append(`${key}[category]`, item.category ?? '');
    if (item.stockOnHand.trim()) form.append(`${key}[stock_on_hand]`, item.stockOnHand.trim());
    if (item.dueDate) form.append(`${key}[due_date]`, item.dueDate);
    if (item.remarks.trim()) form.append(`${key}[remarks]`, item.remarks.trim());
    if (item.document) {
      form.append(`${key}[document]`, await toUploadBlob(item.document), item.document.name);
    }
  }

  for (const { description, file } of draft.attachments) {
    form.append('attachments[]', await toUploadBlob(file), file.name);
    form.append('attachment_descriptions[]', description.trim());
  }
  return form;
}
