import { toUploadBlob } from '@/core/files';

import { parseAmount } from '../create/calculate-line';
import type { DiscountKind, PriceApprovalDraft } from '../types';

const DISCOUNT_OPTION: Record<DiscountKind, string> = { none: '1', percent: '2', nominal: '3' };

/**
 * The body of `POST /price-approval`, always multipart so one path covers requests with and
 * without attachments. Totals are not sent: the server calculates them. The draft must already
 * be valid (see `create/draft.ts`), so the fields below are never null.
 */
export async function buildCreateForm(draft: PriceApprovalDraft): Promise<FormData> {
  const form = new FormData();
  form.append('customer_id', draft.customer?.customer_id ?? '');
  form.append('po_sc', draft.poSc ?? '');
  // The server ignores the order date for SC; do not send a stale one.
  if (draft.poSc === 'PO' && draft.orderDate) form.append('order_date', draft.orderDate);
  form.append('payment_type', draft.paymentType ?? '');
  form.append('category', draft.category ?? '');
  form.append('shipment', draft.shipment ?? '');
  form.append('shipping_note', draft.shippingNote.trim());
  if (draft.remarks.trim()) form.append('remarks', draft.remarks.trim());

  draft.items.forEach((item, index) => {
    const key = `items[${index}]`;
    form.append(`${key}[sku_no]`, item.product?.sku_no ?? '');
    // The server uses the category's manager when there is one and ignores this field then.
    if (item.product && !item.product.pm && item.manager) {
      form.append(`${key}[product_manager]`, item.manager.email);
    }
    form.append(`${key}[qty]`, String(parseAmount(item.qty)));
    form.append(`${key}[unit_price]`, String(parseAmount(item.unitPrice)));
    form.append(`${key}[discount_option]`, DISCOUNT_OPTION[item.discountKind]);
    if (item.discountKind === 'percent') {
      form.append(`${key}[discount_percentage]`, String(parseAmount(item.discountValue)));
    }
    if (item.discountKind === 'nominal') {
      form.append(`${key}[discount_nominal]`, String(parseAmount(item.discountValue)));
    }
    form.append(`${key}[cash_discount]`, String(parseAmount(item.cashDiscount)));
    if (item.remark.trim()) form.append(`${key}[remark]`, item.remark.trim());
  });

  for (const { description, file } of draft.attachments) {
    form.append('attachments[]', await toUploadBlob(file), file.name);
    form.append('attachment_descriptions[]', description.trim());
  }
  return form;
}
