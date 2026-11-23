import { newItem } from '../create/draft';
import type { DraftItem, RequestDesignDraft } from '../types';
import { buildForm } from './buildForm';

jest.mock('@/core/files', () => ({
  toUploadBlob: jest.fn(async () => new Blob(['x'])),
}));

const item = (changes: Partial<DraftItem>): DraftItem => ({ ...newItem(), ...changes });

const draft: RequestDesignDraft = {
  dueDate: '2026-11-26',
  brands: ['BRD01', 'BRD02'],
  description: '  Materi promo ',
  themeConcept: 'Minimalis',
  items: [
    item({
      type: 'IMAGE',
      qty: '3',
      purpose: 'DIGITAL',
      media: 'FEED',
      width: '99',
      durasi: 'stale',
      remarks: ' 1080x1080 ',
      files: [{ uri: 'file:///a.jpg', name: 'a.jpg', mimeType: null, size: 1 }, null, null],
    }),
    item({ type: 'VIDEO', qty: '2', durasi: '30 detik', purpose: 'FISIK' }),
    item({ type: 'IMAGE', qty: '1', purpose: 'FISIK', width: '120', length: '80' }),
  ],
};

const strings = (form: FormData) =>
  [...(form as unknown as { entries: () => Iterable<[string, unknown]> }).entries()].filter(
    ([, value]) => typeof value === 'string',
  ) as [string, string][];

it('sends the header, the brands as an array and each item by its type', async () => {
  const form = await buildForm(draft);

  expect(strings(form)).toEqual([
    ['due_date', '2026-11-26'],
    ['category_codes[]', 'BRD01'],
    ['category_codes[]', 'BRD02'],
    ['description', 'Materi promo'],
    ['theme_concept', 'Minimalis'],
    ['items[0][type]', 'IMAGE'],
    ['items[0][qty]', '3'],
    ['items[0][purpose]', 'DIGITAL'],
    ['items[0][media]', 'FEED'],
    ['items[0][remarks]', '1080x1080'],
    ['items[1][type]', 'VIDEO'],
    ['items[1][qty]', '2'],
    ['items[1][durasi]', '30 detik'],
    ['items[2][type]', 'IMAGE'],
    ['items[2][qty]', '1'],
    ['items[2][purpose]', 'FISIK'],
    ['items[2][width]', '120'],
    ['items[2][length]', '80'],
  ]);
  expect(form.has('items[0][reference]')).toBe(true);
  expect(form.has('items[0][reference_second]')).toBe(false);
});

it('sends _method and updated_at for an edit, with the server id of an existing item', async () => {
  const form = await buildForm(
    { ...draft, items: [item({ serverId: 412, type: 'VIDEO', qty: '2', durasi: '30 detik' })] },
    '2026-11-19T09:15:00+07:00',
  );

  const sent = Object.fromEntries(strings(form));
  expect(sent._method).toBe('PUT');
  expect(sent.updated_at).toBe('2026-11-19T09:15:00+07:00');
  expect(sent['items[0][id]']).toBe('412');
});

it('sends no _method for a new request', async () => {
  const form = await buildForm(draft);
  expect(form.has('_method')).toBe(false);
  expect(form.has('updated_at')).toBe(false);
});
