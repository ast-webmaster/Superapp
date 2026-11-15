import type { ModuleManifest } from '@/shared/types/module';

import { stockPenjualanRoutes } from './navigation/routes';

export const stockPenjualanManifest: ModuleManifest = {
  id: 'stock-penjualan',
  title: 'Stock Penjualan',
  description: 'Check product stock and price',
  route: stockPenjualanRoutes.list,
  icon: 'box',
  // The API answers 403 without one of these; hide the entry instead of opening an error screen.
  permission: ['read_stock_esales', 'read_all_stock_esales'],
};
