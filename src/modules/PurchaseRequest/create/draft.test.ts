import {
  draftTotal,
  emptyDraft,
  firstInvalidStep,
  isDirty,
  newItem,
  validateAttachments,
  validateDetails,
  validateItem,
  validateItems,
} from './draft';
import type { DraftItem, PurchaseRequestDraft } from '../types';

const registered = {
  item_code: 'IT-1',
  item_no: 'PAPER',
  item_description: 'Paper A4',
  uom: 'RIM',
  last_price: 50000,
};

function item(patch: Partial<DraftItem> = {}): DraftItem {
  return {
    ...newItem(),
    item: registered,
    category: 'OTHERS',
    qty: '2',
    unitPrice: '50000',
    ...patch,
  };
}

function draft(patch: Partial<PurchaseRequestDraft> = {}): PurchaseRequestDraft {
  return {
    ...emptyDraft,
    purpose: 'Office supplies',
    category: 'NON STOCK',
    office: { id: 1, office_name: 'HQ' },
    paymentMethod: 'BANK TRANSFER',
    items: [item()],
    ...patch,
  };
}

describe('validateDetails', () => {
  it('asks for every required field on an empty draft', () => {
    expect(Object.keys(validateDetails(emptyDraft)).sort()).toEqual([
      'category',
      'office',
      'paymentMethod',
      'purpose',
    ]);
  });

  it('accepts a complete draft, with vendor and reference left empty', () => {
    expect(validateDetails(draft())).toEqual({});
  });

  it('treats a purpose of spaces as empty', () => {
    expect(validateDetails(draft({ purpose: '   ' }))).toHaveProperty('purpose');
  });
});

describe('validateItem', () => {
  it('accepts a registered item', () => {
    expect(validateItem(item())).toEqual({});
  });

  it('needs a name for a new item, not a registered one', () => {
    expect(validateItem(item({ source: 'new', item: null, newName: ' ' }))).toHaveProperty(
      'newName',
    );
    expect(validateItem(item({ source: 'new', item: null, newName: 'Chair' }))).toEqual({});
    expect(validateItem(item({ item: null }))).toHaveProperty('item');
  });

  it('needs a whole quantity within the server range', () => {
    expect(validateItem(item({ qty: '' }))).toHaveProperty('qty');
    expect(validateItem(item({ qty: '0' }))).toHaveProperty('qty');
    expect(validateItem(item({ qty: '1.5' }))).toHaveProperty('qty');
    expect(validateItem(item({ qty: '65536' }))).toHaveProperty('qty');
    expect(validateItem(item({ qty: '65535' }))).toEqual({});
  });

  it('accepts a unit price of 0 but not an empty one', () => {
    expect(validateItem(item({ unitPrice: '0' }))).toEqual({});
    expect(validateItem(item({ unitPrice: '' }))).toHaveProperty('unitPrice');
  });

  it('needs a document for TRADE and EVENT only', () => {
    const file = { uri: 'file:///a.pdf', name: 'a.pdf', mimeType: 'application/pdf', size: 1000 };
    expect(validateItem(item({ category: 'TRADE' }))).toHaveProperty('document');
    expect(validateItem(item({ category: 'EVENT' }))).toHaveProperty('document');
    expect(validateItem(item({ category: 'TRADE', document: file }))).toEqual({});
    expect(validateItem(item({ category: 'FIXED ASSET' }))).toEqual({});
  });

  it('refuses a document over 10 MB', () => {
    const big = { uri: 'file:///a.pdf', name: 'a.pdf', mimeType: null, size: 11 * 1024 * 1024 };
    expect(validateItem(item({ category: 'OTHERS', document: big }))).toHaveProperty('document');
  });
});

describe('validateItems', () => {
  it('needs at least one item', () => {
    expect(validateItems(draft({ items: [] }))).toHaveProperty('items');
  });

  it('refuses the same registered item twice, as the server does', () => {
    expect(validateItems(draft({ items: [item(), item()] }))).toHaveProperty('items');
  });

  it('allows two new items with the same name', () => {
    const copy = () => item({ source: 'new', item: null, newName: 'Chair' });
    expect(validateItems(draft({ items: [copy(), copy()] }))).toEqual({});
  });
});

describe('validateAttachments', () => {
  const file = (size: number | null) => ({
    uri: 'file:///a.pdf',
    name: 'a.pdf',
    mimeType: null,
    size,
  });

  it('needs a description for every file', () => {
    const attachments = [{ id: 'a1', description: ' ', file: file(10) }];
    expect(validateAttachments(draft({ attachments }))).toHaveProperty('a1');
  });

  it('refuses a file over 20 MB', () => {
    const attachments = [{ id: 'a1', description: 'Quote', file: file(21 * 1024 * 1024) }];
    expect(validateAttachments(draft({ attachments }))).toHaveProperty('a1');
  });
});

it('finds the first step with a problem', () => {
  expect(firstInvalidStep(draft())).toBeNull();
  expect(firstInvalidStep(draft({ purpose: '' }))).toBe('details');
  expect(firstInvalidStep(draft({ items: [] }))).toBe('items');
});

it('totals quantity times unit price over every item', () => {
  expect(draftTotal(draft({ items: [item(), item({ qty: '3', unitPrice: '1000.5' })] }))).toBe(
    103001.5,
  );
});

it('is dirty once anything is entered', () => {
  expect(isDirty(emptyDraft)).toBe(false);
  expect(
    isDirty(draft({ items: [], purpose: '', category: null, office: null, paymentMethod: null })),
  ).toBe(false);
  expect(isDirty({ ...emptyDraft, vendorReference: 'Q-1' })).toBe(true);
});
