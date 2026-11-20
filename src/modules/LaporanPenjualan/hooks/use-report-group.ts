import { useQuery } from '@tanstack/react-query';

import { laporanPenjualanApi } from '../api/laporanPenjualanApi';
import { laporanPenjualanKeys } from '../api/laporanPenjualanKeys';
import { REPORT_GC_TIME_MS, reportStaleTime } from './report-freshness';

export function useReportGroup(period: string | null, group: string) {
  return useQuery({
    queryKey: laporanPenjualanKeys.group(period, group),
    queryFn: ({ signal }) => laporanPenjualanApi.group(period, group, signal),
    // The data changes once a morning: fresh until the next 10:00 (see report-freshness.ts).
    staleTime: reportStaleTime,
    gcTime: REPORT_GC_TIME_MS,
  });
}
