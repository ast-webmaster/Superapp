import type { OnDutyRequestDetail, OnDutyRequestDraft } from '../types';
import {
  allowanceTotal,
  costTotal,
  draftFromDetail,
  emptyDraft,
  firstInvalidStep,
  isDirty,
  newCost,
  newDestination,
  validateAttachments,
  validateCost,
  validateDestination,
  validateDestinations,
  validateDetails,
  type FormContext,
} from './draft';

const create: FormContext = { letterRequired: true, allowanceRate: 300_000 };
const letter = { uri: 'file:///letter.pdf', name: 'letter.pdf', mimeType: null, size: 1000 };

function draft(patch: Partial<OnDutyRequestDraft> = {}): OnDutyRequestDraft {
  return {
    ...emptyDraft,
    type: 'DOMESTIC',
    purpose: 'Dealer visit',
    remarks: 'Routine',
    letter,
    brands: ['ASUS-NB'],
    destinations: [
      {
        ...newDestination(),
        destination: 'Bandung',
        startDate: '2026-11-24',
        endDate: '2026-11-25',
      },
    ],
    costs: [
      {
        ...newCost(),
        item: { item_code: 'HOTEL', item_description: 'Hotel', need_pr: 'NO-PR' },
        amount: '2000000',
      },
    ],
    ...patch,
  };
}

describe('validateDetails', () => {
  it('accepts a complete draft', () => {
    expect(validateDetails(draft(), create)).toEqual({});
  });

  it('asks for every required field', () => {
    expect(Object.keys(validateDetails(emptyDraft, create)).sort()).toEqual([
      'brands',
      'letter',
      'purpose',
      'remarks',
      'type',
    ]);
  });

  it('needs the letter for a new request but not for a resubmit', () => {
    const noLetter = draft({ letter: null });
    expect(validateDetails(noLetter, create).letter).toBeDefined();
    expect(validateDetails(noLetter, { ...create, letterRequired: false })).toEqual({});
  });

  it('refuses a letter over 10 MB', () => {
    const big = draft({ letter: { ...letter, size: 11 * 1024 * 1024 } });
    expect(validateDetails(big, create).letter).toBeDefined();
  });

  it('wants sharing to add up to 100, and ignores brands that are no longer selected', () => {
    const two = draft({ brands: ['A', 'B'] });
    expect(
      validateDetails({ ...two, sharing: { A: '60', B: '30' } }, create).sharing,
    ).toBeDefined();
    expect(validateDetails({ ...two, sharing: { A: '60', B: '40' } }, create)).toEqual({});
    // B was deselected: its old 40 no longer counts, so A alone must reach 100.
    expect(
      validateDetails(draft({ brands: ['A'], sharing: { A: '60', B: '40' } }), create).sharing,
    ).toBeDefined();
    expect(validateDetails(draft({ brands: ['A', 'B'], sharing: {} }), create)).toEqual({});
  });

  it('refuses a percentage that is not 1 to 100', () => {
    const two = draft({ brands: ['A', 'B'] });
    expect(
      validateDetails({ ...two, sharing: { A: '0', B: '100' } }, create).sharing,
    ).toBeDefined();
    expect(validateDetails({ ...two, sharing: { A: '101' } }, create).sharing).toBeDefined();
  });
});

describe('destinations', () => {
  const stop = (start: string, end: string) => ({
    ...newDestination(),
    destination: 'Bandung',
    startDate: start,
    endDate: end,
  });

  it('needs a place and both days', () => {
    expect(Object.keys(validateDestination(newDestination(), []))).toEqual([
      'destination',
      'dates',
    ]);
  });

  it('refuses days that overlap another stop', () => {
    const other = stop('2026-11-24', '2026-11-26');
    expect(validateDestination(stop('2026-11-26', '2026-11-27'), [other]).dates).toBeDefined();
    expect(validateDestination(stop('2026-11-27', '2026-11-27'), [other])).toEqual({});
  });

  it('needs one stop, and an allowance rate for the account', () => {
    expect(validateDestinations(draft({ destinations: [] }), create).destinations).toBeDefined();
    expect(
      validateDestinations(draft(), { ...create, allowanceRate: null }).destinations,
    ).toBeDefined();
    expect(validateDestinations(draft(), create)).toEqual({});
  });

  it('works out the allowance as rate times days, counting both ends', () => {
    expect(allowanceTotal(draft(), 300_000)).toBe(600_000);
    expect(allowanceTotal(draft(), null)).toBe(0);
  });
});

describe('costs', () => {
  it('needs an expense and, except for a voucher, an amount', () => {
    expect(Object.keys(validateCost(newCost()))).toEqual(['item', 'amount']);
    const voucher = {
      ...newCost(),
      item: { item_code: 'V', item_description: 'Voucher', need_pr: 'VOUCHER' },
    };
    expect(validateCost(voucher)).toEqual({});
  });

  it('counts a voucher as nothing, whatever amount was typed before', () => {
    const voucher = {
      ...newCost(),
      item: { item_code: 'V', item_description: 'Voucher', need_pr: 'VOUCHER' },
      amount: '500000',
    };
    expect(costTotal(draft({ costs: [voucher] }))).toBe(0);
    expect(costTotal(draft())).toBe(2_000_000);
  });
});

describe('attachments', () => {
  it('needs a description for each file', () => {
    const withFile = draft({ attachments: [{ id: 'a1', description: ' ', file: letter }] });
    expect(validateAttachments(withFile)).toEqual({ a1: 'Describe this file.' });
  });
});

it('sends the user back to the first step with a problem', () => {
  expect(firstInvalidStep(draft(), create)).toBeNull();
  expect(firstInvalidStep(draft({ costs: [] }), create)).toBe('costs');
  expect(firstInvalidStep(draft({ purpose: '', costs: [] }), create)).toBe('details');
});

describe('isDirty', () => {
  it('is false for an untouched draft and ignores local ids', () => {
    expect(isDirty(emptyDraft)).toBe(false);
    const initial = draft();
    const copy = {
      ...initial,
      destinations: initial.destinations.map((row) => ({ ...row, id: 'other' })),
    };
    expect(isDirty(copy, initial)).toBe(false);
  });

  it('is true once something changed', () => {
    expect(isDirty({ ...emptyDraft, purpose: 'x' })).toBe(true);
    expect(isDirty(draft({ purpose: 'Changed' }), draft())).toBe(true);
  });
});

it('starts a resubmit from the server copy, without files', () => {
  const detail = {
    type: 'OVERSEAS',
    purpose: 'Expo',
    remarks: 'Booth',
    brands: [{ category_code: 'ASUS-NB', category_name: 'ASUS' }],
    sharing: [{ category_code: 'ASUS-NB', category_name: 'ASUS', percentage: 100 }],
    destinations: [{ destination: 'Japan', start_date: '2026-12-01', end_date: '2026-12-03' }],
    costs: [
      {
        item_code: 'HOTEL',
        item_description: 'Hotel',
        need_pr: 'NO-PR',
        amount: 1500000,
        sharing_costs: 'YES',
        remarks: null,
      },
    ],
  } as unknown as OnDutyRequestDetail;

  const result = draftFromDetail(detail);

  expect(result).toMatchObject({
    type: 'OVERSEAS',
    letter: null,
    brands: ['ASUS-NB'],
    sharing: { 'ASUS-NB': '100' },
    attachments: [],
  });
  expect(result.destinations[0]).toMatchObject({
    destination: 'Japan',
    startDate: '2026-12-01',
    endDate: '2026-12-03',
  });
  expect(result.costs[0]).toMatchObject({ amount: '1500000', sharing: true, remarks: '' });
});
