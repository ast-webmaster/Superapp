import { flows } from '../flows';
import type { GimmickDraft } from '../types';
import { buildCreateForm } from './buildCreateForm';

jest.mock('@/core/files', () => ({
  toUploadBlob: jest.fn(async () => new Blob(['x'])),
}));

const draft: GimmickDraft = {
  office: { id: 2, name: 'Cabang' },
  remarks: '  Kaos untuk event ',
  doc: { uri: 'file:///bukti.pdf', name: 'bukti.pdf', mimeType: 'application/pdf', size: 10 },
  items: [
    { id: 'a', item: { code_item: 'GMK-1', name_item: 'Kaos', available: 10 }, qty: '5' },
    { id: 'b', item: { code_item: 'GMK-2', name_item: 'Topi', available: null }, qty: '12' },
  ],
};

const entries = (form: FormData) =>
  [...(form as unknown as { entries: () => Iterable<[string, unknown]> }).entries()].filter(
    ([, value]) => typeof value === 'string',
  );

it('sends the destination, trimmed remarks, the file and indexed items for a request', async () => {
  const form = await buildCreateForm(flows.request, draft);

  expect(Object.fromEntries(entries(form))).toEqual({
    office: '2',
    remarks: 'Kaos untuk event',
    'items[0][code_item]': 'GMK-1',
    'items[0][qty]': '5',
    'items[1][code_item]': 'GMK-2',
    'items[1][qty]': '12',
  });
  expect(form.has('doc')).toBe(true);
});

it('leaves out the destination for an inbound and the file when there is none', async () => {
  const form = await buildCreateForm(flows.inbound, { ...draft, doc: null });

  expect(form.has('office')).toBe(false);
  expect(form.has('doc')).toBe(false);
  expect(form.get('remarks')).toBe('Kaos untuk event');
});
