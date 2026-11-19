import { toUploadBlob } from '@/core/files';

import { parseAmount } from '../create/amount';
import { VOUCHER } from '../create/draft';
import type { OnDutyRequestDraft } from '../types';

/**
 * The body of `POST /on-duty-request` and of `POST /on-duty-request/{uuid}/resubmit`, always
 * multipart because of the letter. Allowances and totals are not sent: the server calculates
 * them. The draft must already be valid (see `create/draft.ts`), so the required fields below
 * are never null.
 */
export async function buildRequestForm(draft: OnDutyRequestDraft): Promise<FormData> {
  const form = new FormData();
  form.append('type', draft.type ?? '');
  form.append('purpose', draft.purpose.trim());
  form.append('remarks', draft.remarks.trim());
  if (draft.letter) {
    form.append('letter_of_assignment', await toUploadBlob(draft.letter), draft.letter.name);
  }

  for (const [index, code] of draft.brands.entries()) form.append(`brand[${index}]`, code);

  // Only brands that are still selected, and only those with a percentage.
  const sharing = draft.brands.flatMap((code) => {
    const percentage = draft.sharing[code]?.trim();
    return percentage ? [{ code, percentage }] : [];
  });
  for (const [index, row] of sharing.entries()) {
    form.append(`sharing[${index}][category_code]`, row.code);
    form.append(`sharing[${index}][percentage]`, row.percentage);
  }

  for (const [index, row] of draft.destinations.entries()) {
    const key = `destinations[${index}]`;
    form.append(`${key}[destination]`, row.destination ?? '');
    form.append(`${key}[start_date]`, row.startDate ?? '');
    form.append(`${key}[end_date]`, row.endDate ?? '');
  }

  for (const [index, cost] of draft.costs.entries()) {
    const key = `costs[${index}]`;
    form.append(`${key}[item_code]`, cost.item?.item_code ?? '');
    // A voucher comes from HRGA and always costs nothing, whatever was typed before.
    form.append(
      `${key}[amount]`,
      String(cost.item?.need_pr === VOUCHER ? 0 : parseAmount(cost.amount)),
    );
    form.append(`${key}[sharing_costs]`, cost.sharing ? 'YES' : 'NO');
    if (cost.remarks.trim()) form.append(`${key}[remarks]`, cost.remarks.trim());
  }

  for (const { description, file } of draft.attachments) {
    form.append('attachments[]', await toUploadBlob(file), file.name);
    form.append('attachment_descriptions[]', description.trim());
  }
  return form;
}
