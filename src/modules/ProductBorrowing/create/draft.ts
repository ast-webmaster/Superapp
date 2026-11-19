import { toAppError } from '@/core/errors';

import type {
  DraftItem,
  ProductBorrowingDetail,
  ProductBorrowingDraft,
  ProductBorrowingItem,
} from '../types';

export const MAX_ITEMS = 50;
export const MAX_QTY = 100_000;
/** The server's limits on the header fields. */
export const MAX_ADDRESS = 1000;
export const MAX_PHONE = 25;
export const MAX_PIC = 50;
export const MAX_NOTE = 1000;
export const MAX_REMARKS = 1000;

export const STEPS = [
  { key: 'details', title: 'Details' },
  { key: 'items', title: 'Items' },
  { key: 'review', title: 'Review' },
] as const;

export type StepKey = (typeof STEPS)[number]['key'];

export const emptyDraft: ProductBorrowingDraft = {
  customer: null,
  address: '',
  phone: '',
  picReceiver: '',
  note: '',
  items: [],
};

let counter = 0;
/** A local id for lists and editing. Never sent to the server. */
export const localId = () => `local-${(counter += 1)}`;

export function newItem(): DraftItem {
  return {
    id: localId(),
    warehouse: null,
    product: null,
    qty: '',
    startDate: null,
    endDate: null,
    productManager: null,
    marketing: null,
    remarks: '',
  };
}

/** Error text by field name. A field with no entry is fine. */
export type Errors = Record<string, string>;

export function validateDetails(draft: ProductBorrowingDraft): Errors {
  const errors: Errors = {};
  if (!draft.customer) errors.customer = 'Choose a customer.';
  if (!draft.address.trim()) errors.address = 'Enter the delivery address.';
  else if (draft.address.trim().length > MAX_ADDRESS) {
    errors.address = `Use at most ${MAX_ADDRESS} characters.`;
  }
  if (!draft.phone.trim()) errors.phone = 'Enter a phone number.';
  else if (draft.phone.trim().length > MAX_PHONE) {
    errors.phone = `Use at most ${MAX_PHONE} characters.`;
  }
  if (!draft.picReceiver.trim()) errors.picReceiver = 'Enter who receives the products.';
  else if (draft.picReceiver.trim().length > MAX_PIC) {
    errors.picReceiver = `Use at most ${MAX_PIC} characters.`;
  }
  if (!draft.note.trim()) errors.note = 'Write a note.';
  else if (draft.note.trim().length > MAX_NOTE) {
    errors.note = `Use at most ${MAX_NOTE} characters.`;
  }
  return errors;
}

/** `others` are the document's other items: a product may appear only once per document. */
export function validateItem(item: DraftItem, others: readonly DraftItem[] = []): Errors {
  const errors: Errors = {};
  if (!item.warehouse) errors.warehouse = 'Choose a warehouse.';
  if (!item.product) errors.product = 'Choose a product.';
  else if (others.some(({ product }) => product?.product_code === item.product?.product_code)) {
    errors.product = 'This product is already in the list.';
  }

  const qty = Number(item.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
    errors.qty = `Enter a whole number from 1 to ${MAX_QTY.toLocaleString('en-US')}.`;
  } else if (item.product?.available != null && qty > item.product.available) {
    errors.qty = `Only ${item.product.available} available.`;
  }

  if (!item.startDate || !item.endDate) errors.period = 'Choose the first and the last day.';
  else if (item.endDate < item.startDate) errors.period = 'The last day is before the first.';

  if (!item.productManager) errors.productManager = 'Choose a product manager.';
  if (!item.marketing) errors.marketing = 'Choose who processes this item.';
  if (item.remarks.trim().length > MAX_REMARKS) {
    errors.remarks = `Use at most ${MAX_REMARKS} characters.`;
  }
  return errors;
}

export function validateItems(draft: ProductBorrowingDraft): Errors {
  if (draft.items.length === 0) return { items: 'Add at least one item.' };
  if (draft.items.length > MAX_ITEMS) return { items: `Use at most ${MAX_ITEMS} items.` };
  return {};
}

export function validateStep(step: StepKey, draft: ProductBorrowingDraft): Errors {
  if (step === 'details') return validateDetails(draft);
  if (step === 'items') return validateItems(draft);
  return {};
}

/** The first step that holds a problem, so Submit can send the user back to it. */
export function firstInvalidStep(draft: ProductBorrowingDraft): StepKey | null {
  return STEPS.find(({ key }) => Object.keys(validateStep(key, draft)).length > 0)?.key ?? null;
}

export function totalQty(draft: ProductBorrowingDraft): number {
  return draft.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
}

/** True once the form differs from what it started with, so leaving asks first. */
export function isDirty(draft: ProductBorrowingDraft, initial: ProductBorrowingDraft): boolean {
  return JSON.stringify(draft) !== JSON.stringify(initial);
}

function draftItemFromDetail(item: ProductBorrowingItem): DraftItem {
  return {
    id: localId(),
    warehouse: item.warehouse,
    // Stock is read again only when the user picks the product again, so the form cannot check
    // the quantity against it. The server does.
    product: {
      product_code: item.product_code,
      product_name: item.product_name,
      available: null,
      product_manager: item.product_manager,
    },
    qty: String(item.qty),
    startDate: item.start_date,
    endDate: item.end_date,
    productManager: item.product_manager
      ? { email: item.product_manager, name: item.product_manager_name }
      : null,
    marketing: item.marketing ? { email: item.marketing, name: item.marketing_name } : null,
    remarks: item.remarks ?? '',
  };
}

/** The form for a document that was sent back, filled in with what the server holds. */
export function draftFromDetail(detail: ProductBorrowingDetail): ProductBorrowingDraft {
  return {
    customer: detail.customer_id
      ? { customer_id: detail.customer_id, customer_name: detail.customer_name }
      : null,
    address: detail.address ?? '',
    phone: detail.phone ?? '',
    picReceiver: detail.pic_receiver ?? '',
    note: detail.note ?? '',
    items: detail.items.map(draftItemFromDetail),
  };
}

/**
 * What to tell the user about a refused submit. A 422 carries one message per wrong field, which
 * says more than the generic "Validasi gagal".
 */
export function submitFailureMessage(error: unknown): string {
  const failure = toAppError(error);
  const first = failure.fieldErrors ? Object.values(failure.fieldErrors).flat()[0] : undefined;
  return first ?? failure.message;
}
