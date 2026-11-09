import { apiClient } from '@/core/api';

import { inboxApi } from './inboxApi';

jest.mock('@/core/api', () => ({ apiClient: { get: jest.fn() } }));

const get = apiClient.get as jest.Mock;
const meta = { current_page: 1, per_page: 5, total: 1, last_page: 1 };

beforeEach(() => get.mockReset().mockResolvedValue({ data: [{ id: 'n1' }], meta }));

it('asks for the given modules as one comma separated list', async () => {
  const result = await inboxApi.list(['price-approval', 'asset'], 5, 2);

  expect(get).toHaveBeenCalledWith('/notifications', {
    query: { module: 'price-approval,asset', per_page: 5, page: 2 },
    signal: undefined,
  });
  expect(result).toEqual({ items: [{ id: 'n1' }], meta });
});

it('leaves the module filter out to ask for every module', async () => {
  await inboxApi.list(undefined, 20, 1);

  expect(get.mock.calls[0][1].query.module).toBeUndefined();
});
