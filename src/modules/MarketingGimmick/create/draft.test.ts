import { flows } from '../flows';
import type { GimmickDraft, DraftItem } from '../types';
import { emptyDraft, fileProblem, isDirty, validateForm, validateItem } from './draft';

const file = (name: string, size: number | null = 1000) => ({
  uri: `file:///${name}`,
  name,
  mimeType: null,
  size,
});

const row = (code: string, qty: string, available: number | null = null): DraftItem => ({
  id: code,
  item: { code_item: code, name_item: code, available },
  qty,
});

const valid: GimmickDraft = {
  office: { id: 2, name: 'Cabang' },
  remarks: 'Kaos untuk event',
  doc: file('bukti.pdf'),
  items: [row('GMK-1', '5')],
};

describe('validateForm', () => {
  it('accepts a complete request and a complete inbound', () => {
    expect(validateForm(flows.request, valid)).toEqual({});
    expect(validateForm(flows.inbound, { ...valid, office: null })).toEqual({});
  });

  it('asks for a destination only on a request', () => {
    const draft = { ...valid, office: null };
    expect(validateForm(flows.request, draft)).toEqual({
      office: 'Choose the destination office.',
    });
    expect(validateForm(flows.inbound, draft)).toEqual({});
  });

  it('requires the proof of an inbound, but not the attachment of a request', () => {
    const draft = { ...valid, doc: null };
    expect(validateForm(flows.inbound, draft)).toEqual({ doc: 'Add the proof.' });
    expect(validateForm(flows.request, draft)).toEqual({});
  });

  it('requires remarks of at most 191 characters and at least one item', () => {
    expect(validateForm(flows.request, { ...valid, remarks: '  ' }).remarks).toBeDefined();
    expect(
      validateForm(flows.request, { ...valid, remarks: 'x'.repeat(192) }).remarks,
    ).toBeDefined();
    expect(validateForm(flows.request, { ...valid, items: [] }).items).toBe(
      'Add at least one item.',
    );
  });
});

describe('validateItem', () => {
  it('needs an item and a whole quantity from 1 to 100,000', () => {
    expect(validateItem({ id: 'a', item: null, qty: '1' }).item).toBeDefined();
    for (const qty of ['', '0', '100001']) expect(validateItem(row('A', qty)).qty).toBeDefined();
    expect(validateItem(row('A', '100000'))).toEqual({});
  });

  it('refuses more than the stock the server reports, and ignores stock it does not report', () => {
    expect(validateItem(row('A', '11', 10)).qty).toBe('Only 10 available.');
    expect(validateItem(row('A', '10', 10))).toEqual({});
    expect(validateItem(row('A', '500', null))).toEqual({});
  });

  it('refuses an item that is already in the document', () => {
    expect(validateItem(row('A', '1'), [row('A', '2')]).item).toBe(
      'This item is already in the list.',
    );
  });
});

describe('fileProblem', () => {
  it('takes jpeg, jpg, png and pdf up to 2 MB, whatever the letter case', () => {
    for (const name of ['a.pdf', 'a.PNG', 'a.jpg', 'a.jpeg'])
      expect(fileProblem(file(name))).toBeUndefined();
    expect(fileProblem(file('a.pdf', 2 * 1024 * 1024))).toBeUndefined();
  });

  it('refuses another type or a bigger file', () => {
    expect(fileProblem(file('a.docx'))).toBe('Choose a JPG, PNG or PDF file.');
    expect(fileProblem(file('noextension'))).toBe('Choose a JPG, PNG or PDF file.');
    expect(fileProblem(file('a.pdf', 2 * 1024 * 1024 + 1))).toBe(
      'That file is larger than 2 MB. Choose a smaller one.',
    );
  });
});

describe('isDirty', () => {
  it('is false for a fresh form and true once anything is entered', () => {
    expect(isDirty(emptyDraft)).toBe(false);
    expect(isDirty({ ...emptyDraft, remarks: 'x' })).toBe(true);
    expect(isDirty({ ...emptyDraft, items: [row('A', '1')] })).toBe(true);
  });
});
