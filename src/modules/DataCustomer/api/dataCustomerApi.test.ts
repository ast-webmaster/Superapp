import { apiClient } from '@/core/api';

import { dataCustomerApi } from './dataCustomerApi';

jest.mock('@/core/api', () => ({ apiClient: { get: jest.fn() } }));

const get = apiClient.get as jest.Mock;
const meta = { current_page: 1, per_page: 15, total: 1, last_page: 1 };

beforeEach(() => get.mockReset());

it('sends the search and page, and leaves an empty search out', async () => {
  get.mockResolvedValue({ data: [], meta });

  await dataCustomerApi.list('contoh', 2);
  await dataCustomerApi.list('', 1);

  expect(get.mock.calls[0]).toEqual([
    '/customer',
    { query: { search: 'contoh', page: 2, per_page: 15 }, signal: undefined },
  ]);
  expect(get.mock.calls[1]?.[1].query.search).toBeUndefined();
});

it('returns the rows with the server paging', async () => {
  get.mockResolvedValue({ data: [{ id: 1 }], meta });

  expect(await dataCustomerApi.list('', 1)).toEqual({ items: [{ id: 1 }], meta });
});

it('reads one customer by id', async () => {
  get.mockResolvedValue({ data: { id: 7 }, meta: null });

  expect(await dataCustomerApi.detail('7')).toEqual({ id: 7 });
  expect(get).toHaveBeenCalledWith('/customer/7', { signal: undefined });
});
