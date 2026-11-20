import { apiClient } from '@/core/api';

import { dataProductApi } from './dataProductApi';

jest.mock('@/core/api', () => ({ apiClient: { get: jest.fn() } }));

const get = apiClient.get as jest.Mock;
const none = { categoryCode: null };
const meta = { current_page: 1, per_page: 15, total: 1, last_page: 1 };

beforeEach(() => get.mockReset());

it('sends the search, category and page, and leaves empty ones out', async () => {
  get.mockResolvedValue({ data: [], meta });

  await dataProductApi.list({ categoryCode: 'NBK' }, 'notebook', 2);
  await dataProductApi.list(none, '', 1);

  expect(get.mock.calls[0]).toEqual([
    '/product',
    {
      query: { search: 'notebook', category_code: 'NBK', page: 2, per_page: 15 },
      signal: undefined,
    },
  ]);
  expect(get.mock.calls[1]?.[1].query.search).toBeUndefined();
  expect(get.mock.calls[1]?.[1].query.category_code).toBeUndefined();
});

it('returns the rows with the server paging', async () => {
  get.mockResolvedValue({ data: [{ id: 1 }], meta });

  expect(await dataProductApi.list(none, '', 1)).toEqual({ items: [{ id: 1 }], meta });
});

it('reads one product by id', async () => {
  get.mockResolvedValue({ data: { id: 7 }, meta: null });

  expect(await dataProductApi.detail('7')).toEqual({ id: 7 });
  expect(get).toHaveBeenCalledWith('/product/7', { signal: undefined });
});

it('reads the category choices', async () => {
  const categories = [{ category_code: 'NBK', category_name: 'Notebook' }];
  get.mockResolvedValue({ data: categories, meta: null });

  expect(await dataProductApi.categories()).toEqual(categories);
  expect(get).toHaveBeenCalledWith('/product/categories', { signal: undefined });
});
