import type { DraftItem, RequestDesignDetail, RequestDesignDraft } from '../types';
import { draftFromDetail, emptyDraft, isDirty, newItem, validateForm, validateItem } from './draft';
import { fileProblem, REFERENCE_RULE, RESULT_RULE } from './files';

const TODAY = '2026-11-20';

const item = (changes: Partial<DraftItem>): DraftItem => ({ ...newItem(), ...changes });

const image = (changes: Partial<DraftItem> = {}) =>
  item({ type: 'IMAGE', qty: '3', purpose: 'DIGITAL', media: 'FEED', ...changes });

const valid: RequestDesignDraft = {
  dueDate: '2026-11-26',
  brands: ['BRD01'],
  description: 'Materi promo akhir tahun',
  themeConcept: 'Minimalis',
  items: [image()],
};

const file = (name: string, size: number | null = 1000) => ({
  uri: `file:///${name}`,
  name,
  mimeType: null,
  size,
});

describe('validateItem', () => {
  it('needs a type and a whole quantity from 1 to 500', () => {
    expect(validateItem(item({})).type).toBeDefined();
    for (const qty of ['', '0', '501', '1.5'])
      expect(validateItem(image({ qty })).qty).toBeDefined();
    expect(validateItem(image({ qty: '500' }))).toEqual({});
  });

  it('asks an image for a purpose, then for where it is used or for its size', () => {
    expect(validateItem(image({ purpose: null })).purpose).toBeDefined();
    expect(validateItem(image({ media: null })).media).toBeDefined();

    const physical = image({ purpose: 'FISIK', media: null });
    expect(validateItem(physical)).toEqual({
      width: 'Enter the width in cm.',
      length: 'Enter the length in cm.',
    });
    expect(validateItem({ ...physical, width: '120', length: '80' })).toEqual({});
  });

  it('asks a video for a duration of at most 50 characters, and nothing about purpose', () => {
    const video = item({ type: 'VIDEO', qty: '2' });
    expect(validateItem(video).durasi).toBeDefined();
    expect(validateItem({ ...video, durasi: 'x'.repeat(51) }).durasi).toBeDefined();
    expect(validateItem({ ...video, durasi: '30 detik' })).toEqual({});
  });

  it('ignores a field left over from a type the user switched away from', () => {
    expect(
      validateItem(item({ type: 'VIDEO', qty: '1', durasi: '10 detik', purpose: null })),
    ).toEqual({});
  });

  it('limits remarks to 1000 characters', () => {
    expect(validateItem(image({ remarks: 'x'.repeat(1001) })).remarks).toBeDefined();
  });
});

describe('validateForm', () => {
  it('accepts a complete request', () => {
    expect(validateForm(valid, TODAY)).toEqual({});
  });

  it('accepts today as the due date but not a day before it', () => {
    expect(validateForm({ ...valid, dueDate: TODAY }, TODAY)).toEqual({});
    expect(validateForm({ ...valid, dueDate: '2026-11-19' }, TODAY).dueDate).toBeDefined();
    expect(validateForm({ ...valid, dueDate: null }, TODAY).dueDate).toBeDefined();
  });

  it('needs a brand, a description and a theme of at most 191 characters', () => {
    expect(validateForm({ ...valid, brands: [] }, TODAY).brands).toBeDefined();
    expect(validateForm({ ...valid, description: '  ' }, TODAY).description).toBeDefined();
    expect(validateForm({ ...valid, themeConcept: ' ' }, TODAY).themeConcept).toBeDefined();
    expect(
      validateForm({ ...valid, themeConcept: 'x'.repeat(192) }, TODAY).themeConcept,
    ).toBeDefined();
  });

  it('needs one to fifty complete items', () => {
    expect(validateForm({ ...valid, items: [] }, TODAY).items).toBe('Add at least one item.');
    expect(validateForm({ ...valid, items: [image({ qty: '' })] }, TODAY).items).toBeDefined();
    expect(
      validateForm({ ...valid, items: Array.from({ length: 51 }, () => image()) }, TODAY).items,
    ).toBe('Use at most 50 items.');
  });
});

describe('fileProblem', () => {
  it('takes the reference types up to 15 MB, whatever the letter case', () => {
    for (const name of ['a.jpg', 'a.PNG', 'a.pdf', 'a.docx', 'a.mp4', 'a.xlsx'])
      expect(fileProblem(file(name), REFERENCE_RULE)).toBeUndefined();
    expect(fileProblem(file('a.zip'), REFERENCE_RULE)).toBe(REFERENCE_RULE.typeProblem);
    expect(fileProblem(file('a.pdf', 15_240 * 1024 + 1), REFERENCE_RULE)).toBe(
      REFERENCE_RULE.sizeProblem,
    );
  });

  it('takes archives and slides as a result, up to 20 MB', () => {
    for (const name of ['a.zip', 'a.rar', 'a.pptx', 'a.jpeg'])
      expect(fileProblem(file(name), RESULT_RULE)).toBeUndefined();
    expect(fileProblem(file('noextension'), RESULT_RULE)).toBe(RESULT_RULE.typeProblem);
    expect(fileProblem(file('a.zip', 20 * 1024 * 1024 + 1), RESULT_RULE)).toBe(
      RESULT_RULE.sizeProblem,
    );
  });
});

describe('draftFromDetail', () => {
  const detail = {
    due_date: '2026-11-26',
    brands: [{ category_code: 'BRD01', category_name: 'Brand' }],
    description: 'Materi',
    theme_concept: 'Biru',
    items: [
      {
        id: 412,
        type: 'IMAGE',
        qty: 3,
        purpose: 'FISIK',
        media: null,
        width: 120,
        length: 80,
        durasi: null,
        remarks: null,
        references: [{ slot: 2, name: 'moodboard.jpg', download_url: 'x' }],
      },
    ],
  } as unknown as RequestDesignDetail;

  it('keeps the server ids and the files the server already holds, by slot', () => {
    const draft = draftFromDetail(detail);
    expect(draft).toMatchObject({ dueDate: '2026-11-26', brands: ['BRD01'], themeConcept: 'Biru' });
    expect(draft.items[0]).toMatchObject({
      serverId: 412,
      qty: '3',
      width: '120',
      length: '80',
      durasi: '',
      kept: [null, 'moodboard.jpg', null],
      files: [null, null, null],
    });
  });

  it('is not dirty until something changes', () => {
    const draft = draftFromDetail(detail);
    expect(isDirty(draft, draft)).toBe(false);
    expect(isDirty({ ...draft, description: 'Lain' }, draft)).toBe(true);
    expect(isDirty(emptyDraft, emptyDraft)).toBe(false);
  });
});
