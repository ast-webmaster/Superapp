import { apiClient } from '@/core/api';

import { laporanPenjualanApi } from './laporanPenjualanApi';

jest.mock('@/core/api', () => ({ apiClient: { get: jest.fn(), getFile: jest.fn() } }));

const get = apiClient.get as jest.Mock;
const getFile = apiClient.getFile as jest.Mock;

beforeEach(() => {
  get.mockReset().mockResolvedValue({ data: {} });
  getFile.mockReset().mockResolvedValue(new Uint8Array());
});

it('leaves the period out so the server picks its default', async () => {
  await laporanPenjualanApi.summary(null);
  await laporanPenjualanApi.summary('2026-10');

  expect(get.mock.calls[0]).toEqual([
    '/wall-report',
    { query: { period: undefined }, signal: undefined },
  ]);
  expect(get.mock.calls[1]?.[1].query).toEqual({ period: '2026-10' });
});

it('asks for the whole report in one request from /bundle', async () => {
  await laporanPenjualanApi.bundle(null);
  await laporanPenjualanApi.bundle('2026-10');

  expect(get.mock.calls[0]).toEqual([
    '/wall-report/bundle',
    { query: { period: undefined }, signal: undefined },
  ]);
  expect(get.mock.calls[1]?.[1].query).toEqual({ period: '2026-10' });
});

it('asks for one group by name', async () => {
  await laporanPenjualanApi.group('2026-10', 'GROUP A');

  expect(get).toHaveBeenCalledWith('/wall-report/group', {
    query: { period: '2026-10', group: 'GROUP A' },
    signal: undefined,
  });
});

it('downloads Excel from /export and PDF from /pdf for the period', async () => {
  await laporanPenjualanApi.exportFile('xlsx', '2026-10');
  await laporanPenjualanApi.exportFile('pdf', '2026-10');

  expect(getFile.mock.calls[0]?.[0]).toBe('/wall-report/export');
  expect(getFile.mock.calls[1]?.[0]).toBe('/wall-report/pdf');
  expect(getFile.mock.calls[1]?.[1].query).toEqual({ period: '2026-10' });
});
