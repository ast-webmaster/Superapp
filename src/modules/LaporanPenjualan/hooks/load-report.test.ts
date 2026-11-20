import { QueryClient } from '@tanstack/react-query';

import { AppError } from '@/core/errors';

import { laporanPenjualanApi } from '../api/laporanPenjualanApi';
import { laporanPenjualanKeys } from '../api/laporanPenjualanKeys';
import type { GroupDetail, ReportSummary } from '../types';
import { loadReport, resetBundleAvailability } from './load-report';

jest.mock('../api/laporanPenjualanApi', () => ({
  laporanPenjualanApi: { bundle: jest.fn(), summary: jest.fn() },
}));

const bundle = laporanPenjualanApi.bundle as jest.Mock;
const summary = laporanPenjualanApi.summary as jest.Mock;

/** No garbage-collection timer, so the test process can exit. */
const makeClient = () => new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });

const report = { period: '2026-11', groups: [] } as unknown as ReportSummary;
const detail = (name: string) => ({ period: '2026-11', group: name }) as unknown as GroupDetail;

beforeEach(() => {
  bundle.mockReset();
  summary.mockReset();
  resetBundleAvailability();
});

it('loads the summary and every group with one request, and caches each group by its key', async () => {
  const queryClient = makeClient();
  bundle.mockResolvedValue({ summary: report, groups: [detail('SAMSUNG'), detail('LG')] });

  await expect(loadReport(queryClient, null, undefined)).resolves.toBe(report);

  expect(bundle).toHaveBeenCalledTimes(1);
  expect(summary).not.toHaveBeenCalled();
  expect(queryClient.getQueryData(laporanPenjualanKeys.group(null, 'SAMSUNG'))).toEqual(
    detail('SAMSUNG'),
  );
  expect(queryClient.getQueryData(laporanPenjualanKeys.group(null, 'LG'))).toEqual(detail('LG'));
});

it('keys the groups by the period that was asked for, as the group page reads them', async () => {
  const queryClient = makeClient();
  bundle.mockResolvedValue({ summary: report, groups: [detail('SAMSUNG')] });

  await loadReport(queryClient, '2026-10');

  expect(queryClient.getQueryData(laporanPenjualanKeys.group('2026-10', 'SAMSUNG'))).toBeDefined();
  expect(queryClient.getQueryData(laporanPenjualanKeys.group(null, 'SAMSUNG'))).toBeUndefined();
});

it('falls back to the summary on a server without /bundle, and stops asking for it', async () => {
  const queryClient = makeClient();
  bundle.mockRejectedValue(new AppError('Not found', 'not_found', 404));
  summary.mockResolvedValue(report);

  await expect(loadReport(queryClient, null)).resolves.toBe(report);
  await expect(loadReport(queryClient, '2026-10')).resolves.toBe(report);

  expect(bundle).toHaveBeenCalledTimes(1);
  expect(summary).toHaveBeenCalledTimes(2);
});

it('does not hide any other failure behind the fallback', async () => {
  const queryClient = makeClient();
  bundle.mockRejectedValue(new AppError('Boom', 'server', 500));

  await expect(loadReport(queryClient, null)).rejects.toThrow('Boom');
  expect(summary).not.toHaveBeenCalled();
});
