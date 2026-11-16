import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { laporanPenjualanApi } from '../api/laporanPenjualanApi';
import { laporanPenjualanKeys } from '../api/laporanPenjualanKeys';

export function useReportSummary(period: string | null) {
  return useQuery({
    queryKey: laporanPenjualanKeys.summary(period),
    queryFn: ({ signal }) => laporanPenjualanApi.summary(period, signal),
    // Keep the old period on screen while the next one loads, instead of flashing the skeleton.
    placeholderData: keepPreviousData,
  });
}
