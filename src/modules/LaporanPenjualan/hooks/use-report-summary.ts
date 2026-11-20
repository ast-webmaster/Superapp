import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';

import { laporanPenjualanKeys } from '../api/laporanPenjualanKeys';
import { loadReport } from './load-report';
import { REPORT_GC_TIME_MS, reportStaleTime } from './report-freshness';

export function useReportSummary(period: string | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: laporanPenjualanKeys.summary(period),
    // One request loads the summary and every group's detail (see load-report.ts).
    queryFn: ({ signal }) => loadReport(queryClient, period, signal),
    // The data changes once a morning: fresh until the next 10:00 (see report-freshness.ts).
    staleTime: reportStaleTime,
    gcTime: REPORT_GC_TIME_MS,
    // Keep the old period on screen while the next one loads, instead of flashing the skeleton.
    placeholderData: keepPreviousData,
  });
}
