/** Every React Query key of this module. The first segment is the manifest id. */
export const laporanPenjualanKeys = {
  all: ['laporan-penjualan'] as const,
  periods: () => [...laporanPenjualanKeys.all, 'periods'] as const,
  summary: (period: string | null) => [...laporanPenjualanKeys.all, 'summary', period] as const,
  group: (period: string | null, group: string) =>
    [...laporanPenjualanKeys.all, 'group', period, group] as const,
};
