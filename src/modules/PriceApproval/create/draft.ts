import type { DraftItem, PriceApprovalDraft } from '../types';
import { calculateLine, parseAmount } from './calculate-line';

export const MAX_ITEMS = 100;
export const MAX_ATTACHMENTS = 10;
/** The server refuses a file over 5 MB, so a bigger one is never sent. */
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const STEPS = [
  { key: 'details', title: 'Details' },
  { key: 'items', title: 'Items' },
  { key: 'attachments', title: 'Attachments' },
  { key: 'review', title: 'Review' },
] as const;

export type StepKey = (typeof STEPS)[number]['key'];

export const emptyDraft: PriceApprovalDraft = {
  poSc: null,
  orderDate: null,
  customer: null,
  paymentType: null,
  category: null,
  shipment: null,
  shippingNote: '',
  remarks: '',
  items: [],
  attachments: [],
};

let counter = 0;
/** A local id for lists and editing. Never sent to the server. */
export const localId = () => `local-${(counter += 1)}`;

export function newItem(): DraftItem {
  return {
    id: localId(),
    product: null,
    manager: null,
    remark: '',
    qty: '',
    unitPrice: '',
    discountKind: 'none',
    discountValue: '',
    cashDiscount: '0',
  };
}

/** Error text by field name. A field with no entry is fine. */
export type Errors = Record<string, string>;

export function validateDetails(draft: PriceApprovalDraft): Errors {
  const errors: Errors = {};
  if (!draft.poSc) errors.poSc = 'Choose PO or SC.';
  if (draft.poSc === 'PO' && !draft.orderDate) errors.orderDate = 'Choose the order date.';
  if (!draft.customer) errors.customer = 'Choose a customer.';
  if (!draft.paymentType) errors.paymentType = 'Choose a payment type.';
  if (!draft.category) errors.category = 'Choose a category.';
  if (!draft.shipment) errors.shipment = 'Choose a shipment.';
  if (!draft.shippingNote.trim()) errors.shippingNote = 'Write a shipping note.';
  return errors;
}

export function validateItem(item: DraftItem): Errors {
  const errors: Errors = {};
  const price = parseAmount(item.unitPrice);
  if (!item.product) errors.product = 'Choose a product.';
  if (item.product && !item.product.pm && !item.manager) {
    errors.manager = 'Choose a product manager.';
  }
  if (parseAmount(item.qty) < 1) errors.qty = 'Enter a quantity of 1 or more.';
  if (price < 1) errors.unitPrice = 'Enter a unit price.';
  if (item.discountKind === 'percent') {
    const percent = parseAmount(item.discountValue);
    if (item.discountValue.trim() === '' || percent > 100) {
      errors.discountValue = 'Enter a percentage from 0 to 100.';
    }
  }
  if (item.discountKind === 'nominal') {
    const nominal = parseAmount(item.discountValue);
    if (item.discountValue.trim() === '' || nominal >= price) {
      errors.discountValue = 'Enter an amount below the unit price.';
    }
  }
  if (parseAmount(item.cashDiscount) > 100) errors.cashDiscount = 'Enter a number from 0 to 100.';
  return errors;
}

export function validateItems(draft: PriceApprovalDraft): Errors {
  return draft.items.length === 0 ? { items: 'Add at least one item.' } : {};
}

/** Attachments are optional, but each one needs a description and must fit the server's limit. */
export function validateAttachments(draft: PriceApprovalDraft): Errors {
  const errors: Errors = {};
  for (const { id, description, file } of draft.attachments) {
    if (!description.trim()) errors[id] = 'Describe this file.';
    else if (file.size !== null && file.size > MAX_ATTACHMENT_BYTES) {
      errors[id] = 'This file is larger than 5 MB.';
    }
  }
  return errors;
}

export function validateStep(step: StepKey, draft: PriceApprovalDraft): Errors {
  if (step === 'details') return validateDetails(draft);
  if (step === 'items') return validateItems(draft);
  if (step === 'attachments') return validateAttachments(draft);
  return {};
}

/** The first step that holds a problem, so Submit can send the user back to it. */
export function firstInvalidStep(draft: PriceApprovalDraft): StepKey | null {
  return STEPS.find(({ key }) => Object.keys(validateStep(key, draft)).length > 0)?.key ?? null;
}

export function itemAmounts(item: DraftItem) {
  return calculateLine({
    price: parseAmount(item.unitPrice),
    qty: parseAmount(item.qty),
    kind: item.discountKind,
    discountValue: parseAmount(item.discountValue),
    cashDiscount: parseAmount(item.cashDiscount),
  });
}

/** The preview total. The server recalculates and its figure is the one that is stored. */
export function draftTotal(draft: PriceApprovalDraft): number {
  return draft.items.reduce((sum, item) => sum + itemAmounts(item).amount, 0);
}

/** True once the user has typed or chosen anything, so leaving asks first. */
export function isDirty(draft: PriceApprovalDraft): boolean {
  return (
    draft.poSc !== null ||
    draft.customer !== null ||
    draft.paymentType !== null ||
    draft.category !== null ||
    draft.shipment !== null ||
    draft.shippingNote !== '' ||
    draft.remarks !== '' ||
    draft.items.length > 0 ||
    draft.attachments.length > 0
  );
}
