import { emptyDraft, newItem } from '../create/draft';
import type { PurchaseRequestDraft } from '../types';
import { buildCreateForm } from './buildCreateForm';

jest.mock('@/core/files', () => ({ toUploadBlob: jest.fn(async () => 'BLOB') }));

/** Records what is appended, so the test reads the body the server would receive. */
class RecordingFormData {
  entries: [string, unknown, string?][] = [];
  append(key: string, value: unknown, filename?: string) {
    this.entries.push([key, value, filename]);
  }
}

const fields = (form: RecordingFormData) =>
  Object.fromEntries(form.entries.filter(([key]) => !key.endsWith('[]')).map(([k, v]) => [k, v]));

function draft(patch: Partial<PurchaseRequestDraft> = {}): PurchaseRequestDraft {
  return {
    ...emptyDraft,
    purpose: ' Office supplies ',
    category: 'NON STOCK',
    office: { id: 7, office_name: 'HQ' },
    paymentMethod: 'COD',
    items: [
      {
        ...newItem(),
        item: {
          item_code: 'IT-1',
          item_no: 'P',
          item_description: 'Paper',
          uom: null,
          last_price: 0,
        },
        category: 'OTHERS',
        qty: '2',
        unitPrice: '1500.5',
      },
    ],
    ...patch,
  };
}

beforeEach(() => {
  (globalThis as { FormData: unknown }).FormData = RecordingFormData;
});

it('sends the fields the create endpoint validates, and no optional field left empty', async () => {
  const form = (await buildCreateForm(draft())) as unknown as RecordingFormData;

  expect(fields(form)).toEqual({
    purpose: 'Office supplies',
    category: 'NON STOCK',
    office_id: '7',
    payment_method: 'COD',
    'items[0][item_code]': 'IT-1',
    'items[0][qty]': '2',
    'items[0][unit_price]': '1500.5',
    'items[0][category]': 'OTHERS',
  });
});

it('sends a new item by name, never with a code', async () => {
  const items = [
    {
      ...newItem(),
      source: 'new' as const,
      newName: ' Chair ',
      category: 'OTHERS' as const,
      qty: '1',
      unitPrice: '10',
    },
  ];
  const form = (await buildCreateForm(draft({ items }))) as unknown as RecordingFormData;

  expect(fields(form)).toMatchObject({ 'items[0][item_name]': 'Chair' });
  expect(fields(form)).not.toHaveProperty('items[0][item_code]');
});

it('sends vendor, optional item fields, documents and attachments with their descriptions', async () => {
  const file = (name: string) => ({ uri: `file:///${name}`, name, mimeType: null, size: 1 });
  const base = draft();
  const form = (await buildCreateForm(
    draft({
      reference: ' REF-1 ',
      vendor: { id: 3, vendor_code: 'V3', company_name: 'Acme' },
      vendorReference: 'Quote 9',
      items: [
        {
          ...base.items[0]!,
          category: 'TRADE',
          stockOnHand: '4',
          dueDate: '2026-12-01',
          remarks: ' Urgent ',
          document: file('spec.pdf'),
        },
      ],
      attachments: [{ id: 'a', description: ' Quote ', file: file('quote.pdf') }],
    }),
  )) as unknown as RecordingFormData;

  expect(fields(form)).toMatchObject({
    reference: 'REF-1',
    vendor_id: '3',
    vendor_reference: 'Quote 9',
    'items[0][stock_on_hand]': '4',
    'items[0][due_date]': '2026-12-01',
    'items[0][remarks]': 'Urgent',
    'items[0][document]': 'BLOB',
  });
  expect(form.entries).toContainEqual(['items[0][document]', 'BLOB', 'spec.pdf']);
  expect(form.entries).toContainEqual(['attachments[]', 'BLOB', 'quote.pdf']);
  expect(form.entries).toContainEqual(['attachment_descriptions[]', 'Quote', undefined]);
});
