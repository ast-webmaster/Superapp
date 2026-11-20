import type { ModuleManifest } from '@/shared/types/module';

import { stockGimmickRoutes } from './navigation/routes';

export const stockGimmickManifest: ModuleManifest = {
  id: 'stock-gimmick',
  title: 'Stock Gimmick',
  description: 'Check gimmick stock and its history',
  route: stockGimmickRoutes.list,
  icon: 'star',
  // The API answers 403 without one of these; hide the entry instead of opening an error screen.
  permission: [
    'read_stock_marketing',
    'read_all_stock_marketing',
    'read_product_manager_stock_marketing',
  ],
};
