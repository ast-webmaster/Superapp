import type {
  DeclarationCostDraft,
  DeclarationDestinationDraft,
  DeclarationDraft,
  OnDutyRequestDetail,
} from '../types';
import { parseAmount } from './amount';
import { rangesOverlap } from './dates';
import { MAX_AMOUNT, MAX_FILE_BYTES, type Errors } from './draft';

/** The declaration starts from what the server holds: real amounts and receipts when there are some. */
export function draftFromDeclaration(detail: OnDutyRequestDetail): DeclarationDraft {
  return {
    costs: detail.costs.map((cost) => ({
      id: cost.id,
      label: cost.item_description ?? cost.item_code,
      estimate: cost.amount,
      amountReal: cost.amount_real === null ? '' : String(cost.amount_real),
      remarks: cost.remarks_real ?? '',
      receipt: null,
      hasStoredReceipt: cost.receipt_url !== null,
    })),
    destinations: detail.destinations.map((row) => ({
      uuid: row.uuid,
      destination: row.destination ?? '-',
      originalStart: row.start_date,
      originalEnd: row.end_date,
      startDate: row.start_date,
      endDate: row.end_date,
    })),
    notes: detail.declaration?.remarks ?? '',
  };
}

export const hasChangedDates = (row: DeclarationDestinationDraft) =>
  row.startDate !== row.originalStart || row.endDate !== row.originalEnd;

export const hasReceipt = (cost: DeclarationCostDraft) =>
  cost.receipt !== null || cost.hasStoredReceipt;

export const declaredTotal = (draft: DeclarationDraft) =>
  draft.costs.reduce((sum, cost) => sum + parseAmount(cost.amountReal), 0);

export const costKey = (cost: Pick<DeclarationCostDraft, 'id'>, field: 'amount' | 'receipt') =>
  `${cost.id}.${field}`;

/** Every cost needs its real amount and a receipt (a new one, or the one already stored). */
export function validateDeclaration(draft: DeclarationDraft): Errors {
  const errors: Errors = {};
  for (const cost of draft.costs) {
    if (cost.amountReal.trim() === '') errors[costKey(cost, 'amount')] = 'Enter the actual amount.';
    else if (parseAmount(cost.amountReal) > MAX_AMOUNT) {
      errors[costKey(cost, 'amount')] = 'This amount is too large.';
    }
    if (!hasReceipt(cost)) errors[costKey(cost, 'receipt')] = 'Attach the receipt.';
    else if (cost.receipt?.size != null && cost.receipt.size > MAX_FILE_BYTES) {
      errors[costKey(cost, 'receipt')] = 'This file is larger than 10 MB.';
    }
  }
  for (const row of draft.destinations) {
    if (!hasChangedDates(row)) continue;
    const range = { start: row.startDate, end: row.endDate };
    const clash = draft.destinations.some(
      (other) =>
        other.uuid !== row.uuid &&
        rangesOverlap(range, { start: other.startDate, end: other.endDate }),
    );
    if (clash) errors[row.uuid] = 'These days overlap another destination.';
  }
  return errors;
}

export function isDeclarationDirty(draft: DeclarationDraft, initial: DeclarationDraft): boolean {
  const strip = (value: DeclarationDraft) => ({
    ...value,
    costs: value.costs.map((cost) => ({ ...cost, receipt: cost.receipt?.uri ?? null })),
  });
  return JSON.stringify(strip(draft)) !== JSON.stringify(strip(initial));
}
