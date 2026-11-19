import type { DeclarationDraft, OnDutyRequestDetail } from '../types';
import {
  declaredTotal,
  draftFromDeclaration,
  hasChangedDates,
  isDeclarationDirty,
  validateDeclaration,
} from './declaration-draft';

const detail = {
  total: 2000000,
  costs: [
    {
      id: 412,
      item_code: 'HOTEL',
      item_description: 'Hotel',
      amount: 2000000,
      amount_real: null,
      remarks_real: null,
      receipt_url: null,
    },
    {
      id: 413,
      item_code: 'TIKET',
      item_description: null,
      amount: 500000,
      amount_real: 450000,
      remarks_real: 'Promo',
      receipt_url: 'https://x/receipt',
    },
  ],
  destinations: [
    { uuid: 'd1', destination: 'Bandung', start_date: '2026-11-24', end_date: '2026-11-25' },
    { uuid: 'd2', destination: 'Cirebon', start_date: '2026-11-26', end_date: '2026-11-27' },
  ],
  declaration: { remarks: 'Selesai' },
} as unknown as OnDutyRequestDetail;

const receipt = { uri: 'file:///r.jpg', name: 'r.jpg', mimeType: null, size: 100 };

it('starts from the real amounts and receipts the server already holds', () => {
  const draft = draftFromDeclaration(detail);

  expect(draft.costs).toEqual([
    expect.objectContaining({ id: 412, label: 'Hotel', amountReal: '', hasStoredReceipt: false }),
    expect.objectContaining({
      id: 413,
      label: 'TIKET',
      amountReal: '450000',
      remarks: 'Promo',
      hasStoredReceipt: true,
    }),
  ]);
  expect(draft.notes).toBe('Selesai');
  expect(draft.destinations.every((row) => !hasChangedDates(row))).toBe(true);
});

describe('validateDeclaration', () => {
  it('needs an amount and a receipt for every cost, but a stored receipt is enough', () => {
    expect(validateDeclaration(draftFromDeclaration(detail))).toEqual({
      '412.amount': 'Enter the actual amount.',
      '412.receipt': 'Attach the receipt.',
    });
  });

  it('accepts a complete declaration', () => {
    const draft = draftFromDeclaration(detail);
    draft.costs[0] = { ...draft.costs[0]!, amountReal: '2100000', receipt };
    expect(validateDeclaration(draft)).toEqual({});
    expect(declaredTotal(draft)).toBe(2_550_000);
  });

  it('refuses changed days that overlap another destination', () => {
    const draft = draftFromDeclaration(detail);
    draft.costs = draft.costs.map((cost) => ({ ...cost, amountReal: '1', receipt }));
    draft.destinations[1] = { ...draft.destinations[1]!, startDate: '2026-11-25' };

    expect(validateDeclaration(draft)).toEqual({ d2: 'These days overlap another destination.' });
  });
});

it('is dirty only after something changed, not for a new receipt of the same file', () => {
  const initial = draftFromDeclaration(detail);
  expect(isDeclarationDirty(structuredClone(initial) as DeclarationDraft, initial)).toBe(false);
  expect(isDeclarationDirty({ ...initial, notes: 'Other' }, initial)).toBe(true);
});
