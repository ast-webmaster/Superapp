import type { PickedFile } from '@/core/files';
import { toAppError } from '@/core/errors';

import type { FlowConfig } from '../flows';
import type { DraftItem, GimmickDraft } from '../types';

export const MAX_ITEMS = 50;
export const MAX_QTY = 100_000;
/** `remarks` is a varchar(191) on the server. */
export const MAX_REMARKS = 191;
/** The server takes jpeg, jpg, png and pdf up to 2 MB for the proof or attachment. */
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
const FILE_EXTENSIONS = ['jpeg', 'jpg', 'png', 'pdf'];

export const emptyDraft: GimmickDraft = { office: null, remarks: '', doc: null, items: [] };

let counter = 0;
/** A local id for lists and editing. Never sent to the server. */
export const localId = () => `local-${(counter += 1)}`;

export function newItem(): DraftItem {
  return { id: localId(), item: null, qty: '' };
}

/** Error text by field name. A field with no entry is fine. */
export type Errors = Record<string, string>;

/** Why the server would refuse this file, checked on the device first. Undefined when it is fine. */
export function fileProblem(file: PickedFile): string | undefined {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!FILE_EXTENSIONS.includes(extension)) return 'Choose a JPG, PNG or PDF file.';
  if (file.size !== null && file.size > MAX_FILE_BYTES) {
    return 'That file is larger than 2 MB. Choose a smaller one.';
  }
  return undefined;
}

/** `others` are the document's other items: an item may appear only once per document. */
export function validateItem(item: DraftItem, others: readonly DraftItem[] = []): Errors {
  const errors: Errors = {};
  if (!item.item) errors.item = 'Choose an item.';
  else if (others.some((other) => other.item?.code_item === item.item?.code_item)) {
    errors.item = 'This item is already in the list.';
  }

  const qty = Number(item.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
    errors.qty = `Enter a whole number from 1 to ${MAX_QTY.toLocaleString('en-US')}.`;
  } else if (item.item?.available != null && qty > item.item.available) {
    errors.qty = `Only ${item.item.available} available.`;
  }
  return errors;
}

export function validateForm(flow: FlowConfig, draft: GimmickDraft): Errors {
  const errors: Errors = {};
  if (flow.needsOffice && !draft.office) errors.office = 'Choose the destination office.';

  if (!draft.remarks.trim()) errors.remarks = 'Write a remark.';
  else if (draft.remarks.trim().length > MAX_REMARKS) {
    errors.remarks = `Use at most ${MAX_REMARKS} characters.`;
  }

  if (!draft.doc) {
    if (flow.docRequired) errors.doc = `Add the ${flow.docLabel.toLowerCase()}.`;
  } else {
    const problem = fileProblem(draft.doc);
    if (problem) errors.doc = problem;
  }

  if (draft.items.length === 0) errors.items = 'Add at least one item.';
  else if (draft.items.length > MAX_ITEMS) errors.items = `Use at most ${MAX_ITEMS} items.`;
  return errors;
}

export function totalQty(draft: GimmickDraft): number {
  return draft.items.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
}

/** True once the form holds something, so leaving asks first. */
export function isDirty(draft: GimmickDraft): boolean {
  return (
    draft.office !== null || draft.remarks !== '' || draft.doc !== null || draft.items.length > 0
  );
}

/**
 * What to tell the user about a refused write. A 422 carries one message per wrong field, which
 * says more than the generic "Validasi gagal".
 */
export function submitFailureMessage(error: unknown): string {
  const failure = toAppError(error);
  const first = failure.fieldErrors ? Object.values(failure.fieldErrors).flat()[0] : undefined;
  return first ?? failure.message;
}
