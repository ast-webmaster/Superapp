import { useQuery } from '@tanstack/react-query';

import { laporanPenjualanApi } from '../api/laporanPenjualanApi';
import { laporanPenjualanKeys } from '../api/laporanPenjualanKeys';

/** The periods with sales in the user's scope. Loaded only while the period sheet is open. */
export function useReportPeriods(enabled: boolean) {
  return useQuery({
    queryKey: laporanPenjualanKeys.periods(),
    queryFn: ({ signal }) => laporanPenjualanApi.periods(signal),
    enabled,
  });
}
