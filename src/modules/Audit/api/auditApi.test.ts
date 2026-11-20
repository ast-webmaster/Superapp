import { apiClient } from '@/core/api';

import { auditApi } from './auditApi';

const DEFAULT_FILTERS = { tab: 'all', status: 'all', year: null, month: null } as const;

jest.mock('@/core/api', () => ({
  apiClient: { get: jest.fn(), put: jest.fn(), post: jest.fn(), getFile: jest.fn() },
}));

const get = apiClient.get as jest.Mock;
const put = apiClient.put as jest.Mock;

beforeEach(() => {
  get.mockReset();
  put.mockReset();
  get.mockResolvedValue({ data: [], meta: {} });
});

it('sends no filter the user did not choose', async () => {
  await auditApi.list(DEFAULT_FILTERS, '', 1);

  expect(get).toHaveBeenCalledWith('/audit', {
    query: {
      tab: undefined,
      status: undefined,
      year: undefined,
      month: undefined,
      search: undefined,
      page: 1,
      per_page: 15,
    },
    signal: undefined,
  });
});

it('sends the tab, status, month and search the user chose', async () => {
  await auditApi.list(
    { tab: 'follow_up', status: 'AWAITING FOLLOW UP', year: 2026, month: 11 },
    'surabaya',
    2,
  );

  expect(get.mock.calls[0][1].query).toMatchObject({
    tab: 'follow_up',
    status: 'AWAITING FOLLOW UP',
    year: 2026,
    month: 11,
    search: 'surabaya',
    page: 2,
  });
});

it('never sends a month without a year, which the server refuses', async () => {
  await auditApi.list({ ...DEFAULT_FILTERS, month: 11 }, '', 1);

  expect(get.mock.calls[0][1].query.month).toBeUndefined();
});

it('clears an empty response or due date by sending null', async () => {
  put.mockResolvedValue({ data: {} });

  await auditApi.respond('audit-1', { findingId: 23, auditeeResponse: '  ', dueDate: null });

  expect(put).toHaveBeenCalledWith('/audit/audit-1/findings/23/response', {
    auditee_response: null,
    due_date: null,
  });
});
