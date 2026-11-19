import type { ProductBorrowingDraft } from '../types';

function required<T>(value: T | null, field: string): T {
  // The form validates every field before it sends, so this is a bug in the form, not user input.
  if (value === null) throw new Error(`Product borrowing draft is missing ${field}`);
  return value;
}

/** The JSON body of `POST /product-borrowing` and, with `updated_at`, of `PUT /{uuid}`. */
export function buildPayload(draft: ProductBorrowingDraft) {
  return {
    customer_id: required(draft.customer, 'customer').customer_id,
    address: draft.address.trim(),
    phone: draft.phone.trim(),
    pic_receiver: draft.picReceiver.trim(),
    note: draft.note.trim(),
    items: draft.items.map((item) => ({
      product_code: required(item.product, 'product').product_code,
      warehouse: required(item.warehouse, 'warehouse'),
      qty: Number(item.qty),
      start_date: required(item.startDate, 'start date'),
      end_date: required(item.endDate, 'end date'),
      product_manager: required(item.productManager, 'product manager').email,
      marketing: required(item.marketing, 'marketing').email,
      remarks: item.remarks.trim() || undefined,
    })),
  };
}
