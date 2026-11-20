import { apiClient } from '@/core/api';

import { stockGimmickApi } from './stockGimmickApi';

jest.mock('@/core/api', () => ({ apiClient: { get: jest.fn(), getFile: jest.fn() } }));

const get = apiClient.get as jest.Mock;
const getFile = apiClient.getFile as jest.Mock;
const meta = { current_page: 1, per_page: 15, total: 1, last_page: 1 };

beforeEach(() => {
  get.mockReset();
  getFile.mockReset();
});

it('sends the search and page, and leaves an empty search out', async () => {
  get.mockResolvedValue({ data: [], meta });

  await stockGimmickApi.list('payung', 2);
  await stockGimmickApi.list('', 1);

  expect(get.mock.calls[0]).toEqual([
    '/stock-gimmick',
    { query: { search: 'payung', page: 2, per_page: 15 }, signal: undefined },
  ]);
  expect(get.mock.calls[1]?.[1].query.search).toBeUndefined();
});

it('returns the rows with the server paging', async () => {
  get.mockResolvedValue({ data: [{ id: 1 }], meta });

  expect(await stockGimmickApi.list('', 1)).toEqual({ items: [{ id: 1 }], meta });
});

it('reads one stock row by id', async () => {
  get.mockResolvedValue({ data: { id: 7 }, meta: null });

  expect(await stockGimmickApi.detail('7')).toEqual({ id: 7 });
  expect(get).toHaveBeenCalledWith('/stock-gimmick/7', { signal: undefined });
});

it('reads the movements of one row', async () => {
  const track = { summary: { current_qty: 5 }, movements: [] };
  get.mockResolvedValue({ data: track, meta: null });

  expect(await stockGimmickApi.movements('7')).toEqual(track);
  expect(get).toHaveBeenCalledWith('/stock-gimmick/7/movements', { signal: undefined });
});

it('downloads the export with a longer timeout', async () => {
  getFile.mockResolvedValue(new Uint8Array([1]));

  await stockGimmickApi.exportXlsx();

  expect(getFile).toHaveBeenCalledWith('/stock-gimmick/export', { timeoutMs: 60_000 });
});
