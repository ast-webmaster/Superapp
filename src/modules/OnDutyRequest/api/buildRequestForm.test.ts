import { emptyDraft, newCost, newDestination } from '../create/draft';
import type { OnDutyRequestDraft } from '../types';
import { buildRequestForm } from './buildRequestForm';

jest.mock('@/core/files', () => ({ toUploadBlob: jest.fn(async () => 'BLOB') }));

/** Records what is appended, so the test reads the body the server would receive. */
class RecordingFormData {
  entries: [string, unknown, string?][] = [];
  append(key: string, value: unknown, filename?: string) {
    this.entries.push([key, value, filename]);
  }
}

const fields = (form: RecordingFormData) =>
  Object.fromEntries(form.entries.filter(([key]) => !key.endsWith('[]')).map(([k, v]) => [k, v]));

const file = (name: string) => ({ uri: `file:///${name}`, name, mimeType: null, size: 10 });

function draft(patch: Partial<OnDutyRequestDraft> = {}): OnDutyRequestDraft {
  return {
    ...emptyDraft,
    type: 'DOMESTIC',
    purpose: ' Dealer visit ',
    remarks: ' Routine ',
    letter: file('letter.pdf'),
    brands: ['ASUS-NB', 'ROG'],
    sharing: { 'ASUS-NB': '60', ROG: '40', GONE: '10' },
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
        sharing: true,
        remarks: ' 2 nights ',
      },
    ],
    ...patch,
  };
}

beforeEach(() => {
  (globalThis as { FormData: unknown }).FormData = RecordingFormData;
});

it('sends the fields the endpoint validates, with the letter as a named file', async () => {
  const form = (await buildRequestForm(draft())) as unknown as RecordingFormData;

  expect(fields(form)).toEqual({
    type: 'DOMESTIC',
    purpose: 'Dealer visit',
    remarks: 'Routine',
    letter_of_assignment: 'BLOB',
    'brand[0]': 'ASUS-NB',
    'brand[1]': 'ROG',
    'sharing[0][category_code]': 'ASUS-NB',
    'sharing[0][percentage]': '60',
    'sharing[1][category_code]': 'ROG',
    'sharing[1][percentage]': '40',
    'destinations[0][destination]': 'Bandung',
    'destinations[0][start_date]': '2026-11-24',
    'destinations[0][end_date]': '2026-11-25',
    'costs[0][item_code]': 'HOTEL',
    'costs[0][amount]': '2000000',
    'costs[0][sharing_costs]': 'YES',
    'costs[0][remarks]': '2 nights',
  });
  expect(form.entries.find(([key]) => key === 'letter_of_assignment')?.[2]).toBe('letter.pdf');
});

it('leaves out the letter on a resubmit that keeps it, and sharing that was not filled in', async () => {
  const form = (await buildRequestForm(
    draft({ letter: null, sharing: {} }),
  )) as unknown as RecordingFormData;
  const keys = Object.keys(fields(form));

  expect(keys).not.toContain('letter_of_assignment');
  expect(keys.some((key) => key.startsWith('sharing'))).toBe(false);
});

it('sends a voucher as zero, whatever amount was typed before', async () => {
  const voucher = {
    ...newCost(),
    item: { item_code: 'V', item_description: 'Voucher', need_pr: 'VOUCHER' },
    amount: '750000',
  };
  const form = (await buildRequestForm(
    draft({ costs: [voucher] }),
  )) as unknown as RecordingFormData;

  expect(fields(form)['costs[0][amount]']).toBe('0');
  expect(fields(form)['costs[0][sharing_costs]']).toBe('NO');
});

it('pairs every attachment with its description by position', async () => {
  const form = (await buildRequestForm(
    draft({
      attachments: [
        { id: 'a', description: ' Ticket ', file: file('ticket.pdf') },
        { id: 'b', description: 'Invite', file: file('invite.png') },
      ],
    }),
  )) as unknown as RecordingFormData;

  const pairs = form.entries
    .filter(([key]) => key === 'attachments[]' || key === 'attachment_descriptions[]')
    .map(([key, value, name]) => [key, value, name]);
  expect(pairs).toEqual([
    ['attachments[]', 'BLOB', 'ticket.pdf'],
    ['attachment_descriptions[]', 'Ticket', undefined],
    ['attachments[]', 'BLOB', 'invite.png'],
    ['attachment_descriptions[]', 'Invite', undefined],
  ]);
});
