import { toUploadBlob } from '@/core/files';

import { parseAmount } from '../create/amount';
import type { DeclarationDraft } from '../types';

/**
 * The body of `POST /on-duty-request/{uuid}/declaration`, always multipart because of the
 * receipts. Every cost row is reported. A destination goes up only when its dates changed: the
 * server then recalculates its allowance from the new dates. The draft must already be valid
 * (see `create/declaration-draft.ts`).
 */
export async function buildDeclarationForm(draft: DeclarationDraft): Promise<FormData> {
  const form = new FormData();

  for (const [index, cost] of draft.costs.entries()) {
    const key = `costs[${index}]`;
    form.append(`${key}[id]`, String(cost.id));
    form.append(`${key}[amount_real]`, String(parseAmount(cost.amountReal)));
    if (cost.remarks.trim()) form.append(`${key}[remarks]`, cost.remarks.trim());
    if (cost.receipt) {
      form.append(`${key}[receipt]`, await toUploadBlob(cost.receipt), cost.receipt.name);
    }
  }

  const changed = draft.destinations.filter(
    (row) => row.startDate !== row.originalStart || row.endDate !== row.originalEnd,
  );
  for (const [index, row] of changed.entries()) {
    const key = `destinations[${index}]`;
    form.append(`${key}[uuid]`, row.uuid);
    form.append(`${key}[start_date]`, row.startDate);
    form.append(`${key}[end_date]`, row.endDate);
  }

  if (draft.notes.trim()) form.append('notes', draft.notes.trim());
  return form;
}
