// Route paths this module owns. The matching files live in src/app/(app)/laporan-penjualan/.
export const laporanPenjualanRoutes = {
  summary: '/laporan-penjualan',
  /** Group names have spaces and may have slashes, so the segment is encoded. */
  group: (name: string) => `/laporan-penjualan/${encodeURIComponent(name)}`,
} as const;
