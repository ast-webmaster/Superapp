import { useQuery } from '@tanstack/react-query';

import { laporanPenjualanApi } from '../api/laporanPenjualanApi';
import { laporanPenjualanKeys } from '../api/laporanPenjualanKeys';

export function useReportGroup(period: string | null, group: string) {
  return useQuery({
    queryKey: laporanPenjualanKeys.group(period, group),
    queryFn: ({ signal }) => laporanPenjualanApi.group(period, group, signal),
  });
}
