import type { ModuleManifest } from '@/shared/types/module';

import { laporanPenjualanRoutes } from './navigation/routes';

export const laporanPenjualanManifest: ModuleManifest = {
  id: 'laporan-penjualan',
  title: 'Laporan Penjualan',
  description: 'Sales against target, per group and branch',
  route: laporanPenjualanRoutes.summary,
  icon: 'chart',
  // The same either-or the backend's Wall Report API checks; without one it answers 403.
  permission: [
    'read_all_wallreport',
    'read_wallreport_by_group',
    'create_wallreport',
    'read_wallreport_by_branch',
    'read_wallreport_by_brand',
  ],
};
