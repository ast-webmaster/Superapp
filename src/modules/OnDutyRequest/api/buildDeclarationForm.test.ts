import type { DeclarationDraft } from '../types';
import { buildDeclarationForm } from './buildDeclarationForm';

jest.mock('@/core/files', () => ({ toUploadBlob: jest.fn(async () => 'BLOB') }));

class RecordingFormData {
  entries: [string, unknown, string?][] = [];
  append(key: string, value: unknown, filename?: string) {
    this.entries.push([key, value, filename]);
  }
}

const asObject = (form: RecordingFormData) =>
  Object.fromEntries(form.entries.map(([key, value]) => [key, value]));

const receipt = { uri: 'file:///r.jpg', name: 'r.jpg', mimeType: null, size: 10 };

const draft: DeclarationDraft = {
  costs: [
    {
      id: 412,
      label: 'Hotel',
      estimate: 2000000,
      amountReal: '2100000',
      remarks: ' Real ',
      receipt,
      hasStoredReceipt: false,
    },
    {
      id: 413,
      label: 'Ticket',
      estimate: 500000,
      amountReal: '450000',
      remarks: '',
      receipt: null,
      hasStoredReceipt: true,
    },
  ],
  destinations: [
    {
      uuid: 'd1',
      destination: 'Bandung',
      originalStart: '2026-11-24',
      originalEnd: '2026-11-25',
      startDate: '2026-11-24',
      endDate: '2026-11-24',
    },
    {
      uuid: 'd2',
      destination: 'Cirebon',
      originalStart: '2026-11-26',
      originalEnd: '2026-11-27',
      startDate: '2026-11-26',
      endDate: '2026-11-27',
    },
  ],
  notes: ' Done ',
};

beforeEach(() => {
  (globalThis as { FormData: unknown }).FormData = RecordingFormData;
});

it('reports every cost, sends a receipt only when a new one was chosen, and trims text', async () => {
  const form = (await buildDeclarationForm(draft)) as unknown as RecordingFormData;

  expect(asObject(form)).toMatchObject({
    'costs[0][id]': '412',
    'costs[0][amount_real]': '2100000',
    'costs[0][remarks]': 'Real',
    'costs[0][receipt]': 'BLOB',
    'costs[1][id]': '413',
    'costs[1][amount_real]': '450000',
    notes: 'Done',
  });
  const keys = Object.keys(asObject(form));
  expect(keys).not.toContain('costs[1][receipt]');
  expect(keys).not.toContain('costs[1][remarks]');
});

it('sends only the destinations whose days changed', async () => {
  const form = (await buildDeclarationForm(draft)) as unknown as RecordingFormData;
  const sent = asObject(form);

  expect(sent).toMatchObject({
    'destinations[0][uuid]': 'd1',
    'destinations[0][start_date]': '2026-11-24',
    'destinations[0][end_date]': '2026-11-24',
  });
  expect(Object.keys(sent).some((key) => key.startsWith('destinations[1]'))).toBe(false);
});
