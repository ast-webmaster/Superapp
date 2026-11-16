import type { DraftItem, PurchaseRequestDraft } from '../types';
import { parseAmount } from './amount';

/** The server's limits (`CreatePurchaseRequestRequest`). */
export const MAX_ITEMS = 100;
export const MAX_ATTACHMENTS = 10;
export const MAX_QTY = 65535;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
/** Item categories whose items must carry a supporting document. */
export const CATEGORIES_NEEDING_DOCUMENT = ['TRADE', 'EVENT'] as const;

export const STEPS = [
  { key: 'details', title: 'Details' },
  { key: 'items', title: 'Items' },
  { key: 'attachments', title: 'Attachments' },
  { key: 'review', title: 'Review' },
] as const;

export type StepKey = (typeof STEPS)[number]['key'];

export const emptyDraft: PurchaseRequestDraft = {
  purpose: '',
  category: null,
  office: null,
  paymentMethod: null,
  reference: '',
  vendor: null,
  vendorReference: '',
  items: [],
  attachments: [],
};

let counter = 0;
/** A local id for lists and editing. Never sent to the server. */
export const localId = () => `local-${(counter += 1)}`;

export function newItem(): DraftItem {
  return {
    id: localId(),
    source: 'registered',
    item: null,
    newName: '',
    category: null,
    qty: '',
    unitPrice: '',
    stockOnHand: '',
    dueDate: null,
    remarks: '',
    document: null,
  };
}

/** Error text by field name. A field with no entry is fine. */
export type Errors = Record<string, string>;

export function needsDocument(item: Pick<DraftItem, 'category'>): boolean {
  return item.category !== null && CATEGORIES_NEEDING_DOCUMENT.includes(item.category as never);
}

/** The name an item shows under: the registered description, or what the user typed. */
export function itemName(item: DraftItem): string {
  return item.source === 'new'
    ? item.newName.trim()
    : (item.item?.item_description ?? item.item?.item_no ?? '');
}

export function validateDetails(draft: PurchaseRequestDraft): Errors {
  const errors: Errors = {};
  if (!draft.purpose.trim()) errors.purpose = 'Write the purpose of this request.';
  if (!draft.category) errors.category = 'Choose a category.';
  if (!draft.office) errors.office = 'Choose a delivery address.';
  if (!draft.paymentMethod) errors.paymentMethod = 'Choose a payment method.';
  return errors;
}

export function validateItem(item: DraftItem): Errors {
  const errors: Errors = {};
  if (item.source === 'registered' && !item.item) errors.item = 'Choose an item.';
  if (item.source === 'new' && !item.newName.trim()) errors.newName = 'Enter the item name.';
  if (!item.category) errors.category = 'Choose a category.';
  const qty = parseAmount(item.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
    errors.qty = `Enter a whole quantity from 1 to ${MAX_QTY}.`;
  }
  if (item.unitPrice.trim() === '') errors.unitPrice = 'Enter a unit price.';
  if (needsDocument(item) && !item.document) {
    errors.document = 'Attach a supporting document for this category.';
  } else if (item.document?.size != null && item.document.size > MAX_DOCUMENT_BYTES) {
    errors.document = 'This file is larger than 10 MB.';
  }
  return errors;
}

export function validateItems(draft: PurchaseRequestDraft): Errors {
  if (draft.items.length === 0) return { items: 'Add at least one item.' };
  // The server refuses the same registered item twice in one request.
  const codes = draft.items.flatMap((item) =>
    item.source === 'registered' && item.item ? [item.item.item_code] : [],
  );
  return new Set(codes).size < codes.length
    ? { items: 'The same item is listed twice. Combine them into one line.' }
    : {};
}

/** Attachments are optional, but each one needs a description and must fit the server's limit. */
export function validateAttachments(draft: PurchaseRequestDraft): Errors {
  const errors: Errors = {};
  for (const { id, description, file } of draft.attachments) {
    if (!description.trim()) errors[id] = 'Describe this file.';
    else if (file.size !== null && file.size > MAX_ATTACHMENT_BYTES) {
      errors[id] = 'This file is larger than 20 MB.';
    }
  }
  return errors;
}

export function validateStep(step: StepKey, draft: PurchaseRequestDraft): Errors {
  if (step === 'details') return validateDetails(draft);
  if (step === 'items') return validateItems(draft);
  if (step === 'attachments') return validateAttachments(draft);
  return {};
}

/** The first step that holds a problem, so Submit can send the user back to it. */
export function firstInvalidStep(draft: PurchaseRequestDraft): StepKey | null {
  return STEPS.find(({ key }) => Object.keys(validateStep(key, draft)).length > 0)?.key ?? null;
}

/** What one item costs. The server uses the same formula and its figure is the one stored. */
export function itemAmount(item: DraftItem): number {
  return parseAmount(item.qty) * parseAmount(item.unitPrice);
}

export function draftTotal(draft: PurchaseRequestDraft): number {
  return draft.items.reduce((sum, item) => sum + itemAmount(item), 0);
}

/** True once the user has typed or chosen anything, so leaving asks first. */
export function isDirty(draft: PurchaseRequestDraft): boolean {
  return (
    draft.purpose !== '' ||
    draft.category !== null ||
    draft.office !== null ||
    draft.paymentMethod !== null ||
    draft.reference !== '' ||
    draft.vendor !== null ||
    draft.vendorReference !== '' ||
    draft.items.length > 0 ||
    draft.attachments.length > 0
  );
}
