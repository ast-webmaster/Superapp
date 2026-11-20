import type { QueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { laporanPenjualanApi } from '../api/laporanPenjualanApi';
import { laporanPenjualanKeys } from '../api/laporanPenjualanKeys';
import type { ReportSummary } from '../types';

/**
 * False once the server has answered 404 to `/bundle`: it is an older version, so the report
 * loads the old way for the rest of the session. The app can ship before the server does.
 */
let bundleAvailable = true;

/** Forget that the server lacked `/bundle`. Only for tests. */
export function resetBundleAvailability() {
  bundleAvailable = true;
}

/**
 * Loads one period's report with a single request and puts every group's detail in the query
 * cache under the key the group page reads, so opening a brand needs no request and shows no
 * loading. Returns the summary, which is what the summary query holds.
 *
 * One request is also what keeps the server's load down: it computes the whole report once
 * where one request per brand would compute it once per brand.
 */
export async function loadReport(
  queryClient: QueryClient,
  period: string | null,
  signal?: AbortSignal,
): Promise<ReportSummary> {
  if (bundleAvailable) {
    try {
      const { summary, groups } = await laporanPenjualanApi.bundle(period, signal);
      for (const detail of groups) {
        queryClient.setQueryData(laporanPenjualanKeys.group(period, detail.group), detail);
      }
      return summary;
    } catch (error) {
      if (toAppError(error).code !== 'not_found') throw error;
      bundleAvailable = false;
    }
  }
  return laporanPenjualanApi.summary(period, signal);
}
