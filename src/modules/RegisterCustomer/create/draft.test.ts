import type { PickedFile } from '@/core/files';

import type { RegisterCustomerDraft } from '../types';
import {
  documentProblem,
  documentRequirement,
  emptyDraft,
  firstInvalidStep,
  isDirty,
  validateContact,
  validateCustomer,
  validateDocuments,
} from './draft';

const file = (name: string, size: number | null = 1000): PickedFile => ({
  uri: `file:///${name}`,
  name,
  mimeType: null,
  size,
});

const customer: Partial<RegisterCustomerDraft> = {
  category: 'Dealer',
  customerName: 'Acme',
  customerAddress: 'Jl. Merdeka 1',
  shippingAddressType: 'SAME',
  phone: '021555',
  formsOfBusiness: 'PT',
  taxationStatus: 'PKP',
  taxIdNumber: '01.234',
};

const contact: Partial<RegisterCustomerDraft> = {
  picName: 'Budi',
  picNumber: '0812',
  picEmail: 'budi@acme.id',
  picDepartment: 'Purchasing',
  ownerName: 'Sari',
  ownerAddress: 'Jl. Mawar 2',
  ownerAddressNowType: 'SAME',
};

const valid: RegisterCustomerDraft = {
  ...emptyDraft,
  ...customer,
  ...contact,
  isGrouping: 'NO',
  documents: { doc_id_card: file('ktp.jpg'), doc_tax_id: file('npwp.pdf') },
};

describe('customer step', () => {
  it('asks for what the server requires', () => {
    expect(Object.keys(validateCustomer(emptyDraft)).sort()).toEqual(
      [
        'category',
        'customerAddress',
        'customerName',
        'formsOfBusiness',
        'phone',
        'shippingAddressType',
        'taxationStatus',
      ].sort(),
    );
    expect(validateCustomer({ ...valid })).toEqual({});
  });

  it('asks for the tax number, or for the 16-digit ID card number of a shop or person', () => {
    expect(validateCustomer({ ...valid, taxIdNumber: '' })).toHaveProperty('taxIdNumber');

    const shop = { ...valid, formsOfBusiness: 'TOKO', taxIdNumber: '' };
    expect(validateCustomer(shop)).toHaveProperty('businessIdCardNumber');
    expect(validateCustomer({ ...shop, businessIdCardNumber: '1234' })).toHaveProperty(
      'businessIdCardNumber',
    );
    expect(validateCustomer({ ...shop, businessIdCardNumber: '1234567890123456' })).toEqual({});
  });

  it('asks for the shipping address only when it differs', () => {
    const different = { ...valid, shippingAddressType: 'DIFFERENT' as const };
    expect(validateCustomer(different)).toHaveProperty('shippingAddress');
    expect(validateCustomer({ ...different, shippingAddress: 'Gudang 3' })).toEqual({});
  });

  it('accepts an empty establishment date or a real one, and nothing else', () => {
    expect(validateCustomer({ ...valid, dateOfIncorporation: '2015-03-24' })).toEqual({});
    expect(validateCustomer({ ...valid, dateOfIncorporation: '2015-02-30' })).toHaveProperty(
      'dateOfIncorporation',
    );
    expect(validateCustomer({ ...valid, dateOfIncorporation: '24-03-2015' })).toHaveProperty(
      'dateOfIncorporation',
    );
  });
});

describe('contact step', () => {
  it('is valid with the required fields and refuses a bad email or owner ID card', () => {
    expect(validateContact(valid)).toEqual({});
    expect(validateContact({ ...valid, picEmail: 'budi' })).toHaveProperty('picEmail');
    expect(validateContact({ ...valid, idCardNumber: '123' })).toHaveProperty('idCardNumber');
    expect(validateContact({ ...valid, ownerAddressNowType: 'DIFFERENT' })).toHaveProperty(
      'ownerAddressNow',
    );
  });
});

describe('documents step', () => {
  it('requires the ID card and the tax ID', () => {
    const errors = validateDocuments({ ...valid, documents: {} });
    expect(Object.keys(errors).sort()).toEqual(['doc_id_card', 'doc_tax_id']);
  });

  it('adds the address statement when the shipping address differs', () => {
    const different = { ...valid, shippingAddressType: 'DIFFERENT' as const };
    expect(documentRequirement('doc_different_address_statement', valid)).toBe('hidden');
    expect(documentRequirement('doc_different_address_statement', different)).toBe('required');
    expect(validateDocuments(different)).toHaveProperty('doc_different_address_statement');
  });

  it('adds the group name, the deed and the grouping permit for a group', () => {
    const grouped = { ...valid, isGrouping: 'YES' as const };
    expect(Object.keys(validateDocuments(grouped)).sort()).toEqual([
      'doc_grouping_permit',
      'doc_memorandum_of_association',
      'groupingCompanyName',
    ]);
    expect(documentRequirement('doc_grouping_permit', valid)).toBe('hidden');
    expect(documentRequirement('doc_memorandum_of_association', valid)).toBe('optional');
  });

  it('refuses a wrong type or a file over 2 MB', () => {
    expect(documentProblem(file('a.pdf'))).toBeNull();
    expect(documentProblem(file('a.JPG'))).toBeNull();
    expect(documentProblem(file('a.docx'))).toMatch(/JPG, PNG or PDF/);
    expect(documentProblem(file('a.pdf', 3 * 1024 * 1024))).toMatch(/2 MB/);
  });
});

it('sends the user back to the first step with a problem', () => {
  expect(firstInvalidStep(valid)).toBeNull();
  expect(firstInvalidStep({ ...valid, picName: '' })).toBe('contact');
  expect(firstInvalidStep({ ...valid, phone: '', picName: '' })).toBe('customer');
  expect(firstInvalidStep({ ...valid, documents: {} })).toBe('documents');
});

it('counts the form as started once anything is entered', () => {
  expect(isDirty(emptyDraft)).toBe(false);
  expect(isDirty({ ...emptyDraft, phone: '1' })).toBe(true);
  expect(isDirty({ ...emptyDraft, documents: { doc_others: file('a.pdf') } })).toBe(true);
});
