import { buildPayload } from '../api/buildPayload';
import type { DraftItem, ProductBorrowingDetail, ProductBorrowingDraft } from '../types';
import {
  draftFromDetail,
  emptyDraft,
  firstInvalidStep,
  isDirty,
  newItem,
  validateDetails,
  validateItem,
  validateItems,
} from './draft';

const person = { email: 'pm@astrindo.co.id', name: 'Product Manager' };

function item(patch: Partial<DraftItem> = {}): DraftItem {
  return {
    ...newItem(),
    warehouse: 'Gudang Demo',
    product: {
      product_code: 'SKU-1',
      product_name: 'Notebook',
      available: 8,
      product_manager: person.email,
    },
    qty: '2',
    startDate: '2026-11-19',
    endDate: '2026-11-26',
    productManager: person,
    marketing: { email: 'mkt@astrindo.co.id', name: null },
    ...patch,
  };
}

const filled: ProductBorrowingDraft = {
  customer: { customer_id: 'CUST-1', customer_name: 'PT Contoh' },
  address: ' Jl. Contoh 1 ',
  phone: '0215550101',
  picReceiver: 'Budi',
  note: 'Demo',
  items: [item({ remarks: ' unit demo ' })],
};

describe('validateDetails', () => {
  it('asks for every field of an empty form', () => {
    expect(Object.keys(validateDetails(emptyDraft))).toEqual([
      'customer',
      'address',
      'phone',
      'picReceiver',
      'note',
    ]);
  });

  it('refuses text over the server limits', () => {
    const errors = validateDetails({
      ...filled,
      phone: '1'.repeat(26),
      picReceiver: 'x'.repeat(51),
    });
    expect(Object.keys(errors)).toEqual(['phone', 'picReceiver']);
  });

  it('accepts a filled form', () => {
    expect(validateDetails(filled)).toEqual({});
  });
});

describe('validateItem', () => {
  it('accepts a complete item', () => {
    expect(validateItem(item())).toEqual({});
  });

  it('refuses a quantity over the stock the server reported', () => {
    expect(validateItem(item({ qty: '9' })).qty).toBe('Only 8 available.');
  });

  it('cannot check the stock of a product restored from a saved document', () => {
    const restored = item({
      qty: '500',
      product: {
        product_code: 'SKU-1',
        product_name: null,
        available: null,
        product_manager: null,
      },
    });
    expect(validateItem(restored).qty).toBeUndefined();
  });

  it('refuses a quantity that is not a whole number from 1 to 100000', () => {
    for (const qty of ['', '0', '1.5', '100001']) {
      expect(validateItem(item({ qty })).qty).toBeDefined();
    }
  });

  it('refuses a product that is already in the document', () => {
    expect(validateItem(item(), [item()]).product).toBe('This product is already in the list.');
  });

  it('refuses a missing period and a period that ends before it starts', () => {
    expect(validateItem(item({ startDate: null, endDate: null })).period).toBeDefined();
    expect(
      validateItem(item({ startDate: '2026-11-26', endDate: '2026-11-19' })).period,
    ).toBeDefined();
    expect(
      validateItem(item({ startDate: '2026-11-19', endDate: '2026-11-19' })).period,
    ).toBeUndefined();
  });

  it('needs a product manager and a marketing person', () => {
    const errors = validateItem(item({ productManager: null, marketing: null }));
    expect(Object.keys(errors)).toEqual(['productManager', 'marketing']);
  });
});

describe('validateItems and firstInvalidStep', () => {
  it('needs at least one item', () => {
    expect(validateItems(emptyDraft).items).toBeDefined();
  });

  it('sends the user to the first step with a problem', () => {
    expect(firstInvalidStep(emptyDraft)).toBe('details');
    expect(firstInvalidStep({ ...filled, items: [] })).toBe('items');
    expect(firstInvalidStep(filled)).toBeNull();
  });
});

describe('isDirty', () => {
  it('is false until the form differs from where it started', () => {
    expect(isDirty(emptyDraft, emptyDraft)).toBe(false);
    expect(isDirty({ ...emptyDraft, note: 'x' }, emptyDraft)).toBe(true);
  });
});

describe('draftFromDetail', () => {
  it('fills the form from the server copy, with the people and dates of each item', () => {
    const detail = {
      customer_id: 'CUST-1',
      customer_name: 'PT Contoh',
      address: 'Jl. Contoh 1',
      phone: '0215550101',
      pic_receiver: 'Budi',
      note: 'Demo',
      items: [
        {
          product_code: 'SKU-1',
          product_name: 'Notebook',
          warehouse: 'Gudang Demo',
          qty: 2,
          start_date: '2026-11-19',
          end_date: '2026-11-26',
          product_manager: person.email,
          product_manager_name: person.name,
          marketing: 'mkt@astrindo.co.id',
          marketing_name: null,
          remarks: null,
        },
      ],
    } as unknown as ProductBorrowingDetail;

    const draft = draftFromDetail(detail);

    expect(draft.customer).toEqual({ customer_id: 'CUST-1', customer_name: 'PT Contoh' });
    expect(draft.items[0]).toMatchObject({
      warehouse: 'Gudang Demo',
      qty: '2',
      startDate: '2026-11-19',
      endDate: '2026-11-26',
      productManager: person,
      marketing: { email: 'mkt@astrindo.co.id', name: null },
      remarks: '',
    });
    expect(firstInvalidStep(draft)).toBeNull();
  });
});

describe('buildPayload', () => {
  it('sends the wire fields, trimmed, with numbers for quantities and ids only for choices', () => {
    expect(buildPayload(filled)).toEqual({
      customer_id: 'CUST-1',
      address: 'Jl. Contoh 1',
      phone: '0215550101',
      pic_receiver: 'Budi',
      note: 'Demo',
      items: [
        {
          product_code: 'SKU-1',
          warehouse: 'Gudang Demo',
          qty: 2,
          start_date: '2026-11-19',
          end_date: '2026-11-26',
          product_manager: 'pm@astrindo.co.id',
          marketing: 'mkt@astrindo.co.id',
          remarks: 'unit demo',
        },
      ],
    });
  });

  it('leaves empty remarks out', () => {
    expect(buildPayload({ ...filled, items: [item()] }).items[0]?.remarks).toBeUndefined();
  });

  it('throws on an incomplete draft, which the form never lets through', () => {
    expect(() => buildPayload(emptyDraft)).toThrow('missing customer');
  });
});
