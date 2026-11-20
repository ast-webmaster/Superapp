import { useQuery } from '@tanstack/react-query';

import { laporanPenjualanApi } from '../api/laporanPenjualanApi';
import { laporanPenjualanKeys } from '../api/laporanPenjualanKeys';
import { REPORT_GC_TIME_MS, reportStaleTime } from './report-freshness';

/** The periods with sales in the user's scope. They feed the period chips and the period sheet. */
export function useReportPeriods(enabled = true) {
  return useQuery({
    queryKey: laporanPenjualanKeys.periods(),
    queryFn: ({ signal }) => laporanPenjualanApi.periods(signal),
    enabled,
    // A new month appears with the morning update, like the figures: fresh until the next 10:00.
    staleTime: reportStaleTime,
    gcTime: REPORT_GC_TIME_MS,
  });
}
