import { apiClient } from '@/core/api';

import { stockPenjualanApi } from './stockPenjualanApi';

jest.mock('@/core/api', () => ({ apiClient: { get: jest.fn(), getFile: jest.fn() } }));

const get = apiClient.get as jest.Mock;
const baseMeta = { current_page: 1, per_page: 15, total: 1, last_page: 1, last_updated_at: null };
const filters = { categoryCode: null, type: 'AVAILABLE' } as const;

beforeEach(() => get.mockReset());

it('sends the search, category, type and page, and leaves empty ones out', async () => {
  get.mockResolvedValue({ data: [], meta: { ...baseMeta, view: 'sales' } });

  await stockPenjualanApi.list({ categoryCode: 'LOG', type: 'ON HAND' }, 'kabel', 2);
  await stockPenjualanApi.list(filters, '', 1);

  expect(get.mock.calls[0]).toEqual([
    '/stock-esales',
    {
      query: {
        search: 'kabel',
        category_code: 'LOG',
        type: 'ON HAND',
        page: 2,
        per_page: 15,
      },
      signal: undefined,
    },
  ]);
  expect(get.mock.calls[1]?.[1].query.search).toBeUndefined();
  expect(get.mock.calls[1]?.[1].query.category_code).toBeUndefined();
});

it('tags each row with the view the server answered with', async () => {
  const sales = { product_code: 'A' };
  const all = { product_code: 'B' };

  get.mockResolvedValueOnce({ data: [sales], meta: { ...baseMeta, view: 'sales' } });
  const salesPage = await stockPenjualanApi.list(filters, '', 1);
  get.mockResolvedValueOnce({ data: [all], meta: { ...baseMeta, view: 'all' } });
  const allPage = await stockPenjualanApi.list(filters, '', 1);

  expect(salesPage.items).toEqual([{ product_code: 'A', kind: 'sales' }]);
  expect(allPage.items).toEqual([{ product_code: 'B', kind: 'all' }]);
  expect(allPage.meta.view).toBe('all');
});
