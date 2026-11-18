import { emptyDraft } from '../create/draft';
import type { RegisterCustomerDraft } from '../types';
import { buildCreateForm } from './buildCreateForm';

jest.mock('@/core/files', () => ({ toUploadBlob: jest.fn(async () => 'BLOB') }));

/** Records what is appended, so the test reads the body the server would receive. */
class RecordingFormData {
  entries: [string, unknown, string?][] = [];
  append(key: string, value: unknown, filename?: string) {
    this.entries.push([key, value, filename]);
  }
}

async function build(draft: RegisterCustomerDraft) {
  const original = global.FormData;
  global.FormData = RecordingFormData as unknown as typeof FormData;
  try {
    const form = (await buildCreateForm(draft)) as unknown as RecordingFormData;
    return {
      fields: Object.fromEntries(form.entries.map(([key, value]) => [key, value])),
      files: form.entries.filter(([, value]) => value === 'BLOB').map(([key, , name]) => [key, name]),
    };
  } finally {
    global.FormData = original;
  }
}

const doc = (name: string) => ({ uri: `file:///${name}`, name, mimeType: null, size: 10 });

const draft: RegisterCustomerDraft = {
  ...emptyDraft,
  category: 'Dealer',
  customerName: ' Acme ',
  customerAddress: 'Jl. Merdeka 1',
  shippingAddressType: 'SAME',
  shippingAddress: 'left over',
  phone: '021555',
  formsOfBusiness: 'PT',
  taxationStatus: 'PKP',
  taxIdNumber: '01.234',
  businessIdCardNumber: '1234567890123456',
  picName: 'Budi',
  picNumber: '0812',
  picEmail: 'budi@acme.id',
  picDepartment: 'Purchasing',
  ownerName: 'Sari',
  ownerAddress: 'Jl. Mawar 2',
  ownerAddressNowType: 'SAME',
  ownerAddressNow: 'left over',
  isGrouping: 'NO',
  groupingCompanyName: 'left over',
  documents: {
    doc_id_card: doc('ktp.jpg'),
    doc_tax_id: doc('npwp.pdf'),
    // Picked before the user chose "No group": it must not be sent.
    doc_grouping_permit: doc('permit.pdf'),
  },
};

it('sends trimmed text, and only the identity number that fits the business form', async () => {
  const { fields } = await build(draft);

  expect(fields.customer_name).toBe('Acme');
  expect(fields.tax_id_number).toBe('01.234');
  expect(fields).not.toHaveProperty('business_id_card_number');

  const shop = await build({ ...draft, formsOfBusiness: 'TOKO' });
  expect(shop.fields.business_id_card_number).toBe('1234567890123456');
  expect(shop.fields).not.toHaveProperty('tax_id_number');
});

it('leaves out fields that only apply to a different address or to a group', async () => {
  const { fields } = await build(draft);

  expect(fields).not.toHaveProperty('shipping_address');
  expect(fields).not.toHaveProperty('owner_address_now');
  expect(fields).not.toHaveProperty('grouping_company_name');
  expect(fields).not.toHaveProperty('fax');

  const other = await build({
    ...draft,
    shippingAddressType: 'DIFFERENT',
    shippingAddress: 'Gudang 3',
    isGrouping: 'YES',
    groupingCompanyName: 'Acme Group',
  });
  expect(other.fields.shipping_address).toBe('Gudang 3');
  expect(other.fields.grouping_company_name).toBe('Acme Group');
});

it('sends each document under its field name, and skips one the form no longer asks for', async () => {
  const { files } = await build(draft);

  expect(files).toEqual([
    ['doc_id_card', 'ktp.jpg'],
    ['doc_tax_id', 'npwp.pdf'],
  ]);
});
