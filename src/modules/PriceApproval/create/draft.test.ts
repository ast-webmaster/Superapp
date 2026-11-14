import { calculateLine, groupThousands, sanitizeAmount, sanitizeMoney } from './calculate-line';
import {
  draftTotal,
  emptyDraft,
  firstInvalidStep,
  isDirty,
  newItem,
  validateAttachments,
  validateDetails,
  validateItem,
} from './draft';
import type { DraftItem, PriceApprovalDraft } from '../types';

const product = {
  sku_no: 'SKU-1',
  product_code: 'P1',
  product_name: 'Pump',
  price: '1110.00',
  pm: 'pm@x.id',
};
const validItem = (patch: Partial<DraftItem> = {}): DraftItem => ({
  ...newItem(),
  product,
  qty: '2',
  unitPrice: '1110',
  ...patch,
});
const validDraft = (): PriceApprovalDraft => ({
  ...emptyDraft,
  poSc: 'SC',
  customer: { customer_id: 'C1', customer_name: 'Acme', office_code: null },
  paymentType: 'TOP',
  category: 'PKP',
  shipment: 'DS',
  shippingNote: 'Morning',
  items: [validItem()],
});

describe('calculateLine (mirrors the server)', () => {
  it('has no discount: amount is price x qty', () => {
    expect(
      calculateLine({ price: 1110, qty: 2, kind: 'none', discountValue: 0, cashDiscount: 0 }),
    ).toEqual({
      priceAfterDiscount: 1110,
      amount: 2220,
    });
  });

  it('takes a percent discount off the price without VAT', () => {
    expect(
      calculateLine({ price: 1110, qty: 1, kind: 'percent', discountValue: 10, cashDiscount: 0 }),
    ).toEqual({
      priceAfterDiscount: 999,
      amount: 999,
    });
  });

  it('takes a nominal discount off the price and a cash discount off the total', () => {
    expect(
      calculateLine({ price: 1110, qty: 2, kind: 'nominal', discountValue: 110, cashDiscount: 10 }),
    ).toEqual({
      priceAfterDiscount: 1000,
      amount: 1800,
    });
  });
});

describe('sanitizeAmount', () => {
  it('keeps digits and one decimal point', () => {
    expect(sanitizeAmount('1a2,5.3')).toBe('12.53');
  });
});

describe('validation', () => {
  it('requires every detail field, and the order date only for PO', () => {
    expect(Object.keys(validateDetails(emptyDraft)).sort()).toEqual([
      'category',
      'customer',
      'paymentType',
      'poSc',
      'shipment',
      'shippingNote',
    ]);
    expect(validateDetails({ ...validDraft(), poSc: 'PO' }).orderDate).toBeDefined();
    expect(validateDetails(validDraft())).toEqual({});
  });

  it('asks for a product manager only when the category has none', () => {
    expect(validateItem(validItem())).toEqual({});
    const noPm = validItem({ product: { ...product, pm: null } });
    expect(validateItem(noPm).manager).toBeDefined();
    expect(validateItem({ ...noPm, manager: { email: 'a@x.id', name: null } })).toEqual({});
  });

  it('checks quantity, price and discount limits', () => {
    const errors = validateItem(
      validItem({ qty: '0', unitPrice: '', discountKind: 'percent', discountValue: '101' }),
    );
    expect(Object.keys(errors).sort()).toEqual(['discountValue', 'qty', 'unitPrice']);
    expect(
      validateItem(validItem({ discountKind: 'nominal', discountValue: '1110' })).discountValue,
    ).toBeDefined();
  });

  it('needs a description on every attachment', () => {
    const draft = {
      ...validDraft(),
      attachments: [
        { id: 'a', description: ' ', file: { uri: 'u', name: 'f.pdf', mimeType: null, size: 10 } },
      ],
    };
    expect(validateAttachments(draft)).toEqual({ a: 'Describe this file.' });
  });

  it('points at the first step with a problem', () => {
    expect(firstInvalidStep(emptyDraft)).toBe('details');
    expect(firstInvalidStep({ ...validDraft(), items: [] })).toBe('items');
    expect(firstInvalidStep(validDraft())).toBeNull();
  });
});

describe('draft helpers', () => {
  it('sums the preview total and detects work in progress', () => {
    expect(draftTotal(validDraft())).toBe(2220);
    expect(isDirty(emptyDraft)).toBe(false);
    expect(isDirty(validDraft())).toBe(true);
  });
});

describe('rupiah input', () => {
  it('shows thousands grouped and keeps the raw value plain', () => {
    expect(groupThousands('100000')).toBe('100,000');
    expect(groupThousands('1234567.5')).toBe('1,234,567.5');
    expect(groupThousands('')).toBe('');
    expect(sanitizeMoney('100,000')).toBe('100000');
    expect(sanitizeMoney('1,234.5')).toBe('1234.5');
  });
});
