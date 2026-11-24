import type { SalesVisitationDetail, SalesVisitationDraft } from '../types';
import {
  draftFromDetail,
  emptyDraft,
  isDirty,
  parseCoordinates,
  todayIso,
  validateForm,
} from './draft';

const valid: SalesVisitationDraft = {
  unregistered: false,
  customer: { customer_id: 'C-1', customer_name: 'PT Maju' },
  customerName: '',
  title: 'Monthly visit',
  date: '2026-11-25',
  location: { latitude: -6.2, longitude: 106.8, label: 'Jakarta' },
  purposeIds: [1],
  categoryCodes: ['ASUS'],
  plan: 'Show the new line',
  result: '',
};

describe('validateForm', () => {
  it('accepts a complete form', () => {
    expect(validateForm(valid)).toEqual({});
  });

  it('flags every missing field of an empty form', () => {
    expect(Object.keys(validateForm(emptyDraft)).sort()).toEqual([
      'categories',
      'customer',
      'date',
      'location',
      'plan',
      'purposes',
      'title',
    ]);
  });

  it('asks for the free-text name of an unregistered customer instead of a pick', () => {
    expect(validateForm({ ...valid, unregistered: true, customer: null }).customer).toBe(
      'Enter the customer name.',
    );
    expect(
      validateForm({ ...valid, unregistered: true, customer: null, customerName: ' Toko Baru ' }),
    ).toEqual({});
  });

  it('checks nothing once the visit is past planning', () => {
    expect(validateForm(emptyDraft, true)).toEqual({});
  });
});

describe('draftFromDetail', () => {
  const detail = {
    title: 'Monthly visit',
    visitation_date: '2026-11-25',
    customer_id: null,
    customer_name: 'Toko Baru',
    customer_registered: false,
    latitude: -6.2,
    longitude: 106.8,
    location_label: null,
    purposes: [{ id: 2, name: 'Demo' }],
    categories: [{ category_code: 'ASUS', category_name: 'Asus' }],
    plan: 'Plan',
    result: null,
  } as unknown as SalesVisitationDetail;

  it('keeps the free-text customer apart from a registered one', () => {
    const draft = draftFromDetail(detail);
    expect(draft).toMatchObject({
      unregistered: true,
      customer: null,
      customerName: 'Toko Baru',
      purposeIds: [2],
      categoryCodes: ['ASUS'],
      result: '',
    });
    expect(draft.location?.label).toBe('');
  });
});

describe('isDirty', () => {
  it('is false for an untouched form and true after a change', () => {
    expect(isDirty(valid, { ...valid })).toBe(false);
    expect(isDirty({ ...valid, title: 'Other' }, valid)).toBe(true);
  });
});

describe('parseCoordinates', () => {
  it('reads a pair separated by a comma or a space', () => {
    expect(parseCoordinates('-6.2, 106.8')).toEqual({ latitude: -6.2, longitude: 106.8 });
    expect(parseCoordinates('-6.2 106.8')).toEqual({ latitude: -6.2, longitude: 106.8 });
  });

  it('refuses text and out-of-range values', () => {
    expect(parseCoordinates('Jl. Sudirman')).toBeNull();
    expect(parseCoordinates('91, 10')).toBeNull();
    expect(parseCoordinates('10, 181')).toBeNull();
  });
});

describe('todayIso', () => {
  it('pads month and day', () => {
    expect(todayIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
