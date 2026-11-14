import { emptyDraft, newItem } from '../create/draft';
import type { PriceApprovalDraft } from '../types';
import { buildCreateForm } from './buildCreateForm';

jest.mock('@/core/files', () => ({ toUploadBlob: jest.fn(async () => 'BLOB') }));

/** Records what is appended, so the test reads the body the server would receive. */
class RecordingFormData {
  entries: [string, unknown, string?][] = [];
  append(key: string, value: unknown, filename?: string) {
    this.entries.push([key, value, filename]);
  }
}

const field = (form: RecordingFormData) =>
  Object.fromEntries(form.entries.filter(([key]) => !key.endsWith('[]')).map(([k, v]) => [k, v]));

const product = {
  sku_no: 'SKU-1',
  product_code: 'P1',
  product_name: 'Pump',
  price: '1110',
  pm: null,
};

function draft(patch: Partial<PriceApprovalDraft> = {}): PriceApprovalDraft {
  return {
    ...emptyDraft,
    poSc: 'PO',
    orderDate: '2026-11-05',
    customer: { customer_id: 'C1', customer_name: 'Acme', office_code: null },
    paymentType: 'TOP',
    category: 'PKP',
    shipment: 'DS',
    shippingNote: ' Morning ',
    items: [
      {
        ...newItem(),
        product,
        manager: { email: 'pm@x.id', name: null },
        qty: '2',
        unitPrice: '1110',
        discountKind: 'percent',
        discountValue: '10',
        cashDiscount: '0',
      },
    ],
    ...patch,
  };
}

beforeEach(() => {
  (globalThis as { FormData: unknown }).FormData = RecordingFormData;
});

it('sends the fields the create endpoint validates, in bracket notation', async () => {
  const form = (await buildCreateForm(draft())) as unknown as RecordingFormData;

  expect(field(form)).toEqual({
    customer_id: 'C1',
    po_sc: 'PO',
    order_date: '2026-11-05',
    payment_type: 'TOP',
    category: 'PKP',
    shipment: 'DS',
    shipping_note: 'Morning',
    'items[0][sku_no]': 'SKU-1',
    // The product's category has no manager, so the chosen one is sent.
    'items[0][product_manager]': 'pm@x.id',
    'items[0][qty]': '2',
    'items[0][unit_price]': '1110',
    'items[0][discount_option]': '2',
    'items[0][discount_percentage]': '10',
    'items[0][cash_discount]': '0',
  });
});

it('leaves out the order date for SC and the manager when the category has one', async () => {
  const withPm = draft({ poSc: 'SC' });
  withPm.items = withPm.items.map((item) => ({ ...item, product: { ...product, pm: 'cat@x.id' } }));
  const form = (await buildCreateForm(withPm)) as unknown as RecordingFormData;

  expect(field(form)).not.toHaveProperty('order_date');
  expect(field(form)).not.toHaveProperty('items[0][product_manager]');
});

it('sends attachments with their descriptions in the same order', async () => {
  const files = ['a.pdf', 'b.pdf'].map((name, index) => ({
    id: String(index),
    description: `Doc ${index}`,
    file: { uri: `file:///${name}`, name, mimeType: null, size: 1 },
  }));
  const form = (await buildCreateForm(
    draft({ attachments: files }),
  )) as unknown as RecordingFormData;

  expect(form.entries.filter(([key]) => key === 'attachments[]').map(([, , name]) => name)).toEqual(
    ['a.pdf', 'b.pdf'],
  );
  expect(
    form.entries.filter(([key]) => key === 'attachment_descriptions[]').map(([, value]) => value),
  ).toEqual(['Doc 0', 'Doc 1']);
});
